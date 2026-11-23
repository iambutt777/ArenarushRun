// Arena Rush - TikTok LIVE bridge.
// Usage: node server.js <tiktok_username>
// Then open http://localhost:8787/?live=1 (Chrome window or OBS Browser Source).
const http = require('http'), fs = require('fs'), path = require('path');
const { WebSocketServer } = require('ws');
const TL = require('tiktok-live-connector');
const Conn = TL.TikTokLiveConnection || TL.WebcastPushConnection; // works with v1 and v2

let username = (process.argv[2] || '').replace(/^@/, '').trim();
// The username can also be entered in the game's admin panel.
const PORT = 8787, GAME = path.join(__dirname, '..', 'arena-rush.html'), MEDIA = path.join(__dirname, '..', 'media');
const TYPES = { '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime', '.m4v': 'video/mp4',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.m4a': 'audio/mp4', '.aac': 'audio/aac',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif' };
const listMedia = d => { try { return fs.readdirSync(path.join(MEDIA, d)).filter(f => TYPES[path.extname(f).toLowerCase()]).sort(); } catch { return []; } };

// Serves the game and proxies profile pictures (TikTok images often block other sites).
let picFail = 0;
const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://localhost');
  if (u.pathname === '/img') {
    try {
      const src = new URL(u.searchParams.get('u'));
      if (src.protocol !== 'https:') throw 0;
      const r = await fetch(src, { headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        'Referer': 'https://www.tiktok.com/' } });
      if (!r.ok) { if (picFail++ < 3) console.log('Profile picture blocked by TikTok (status ' + r.status + ')'); throw 0; }
      res.writeHead(200, { 'Content-Type': r.headers.get('content-type') || 'image/jpeg', 'Cache-Control': 'max-age=3600' });
      res.end(Buffer.from(await r.arrayBuffer()));
    } catch { res.writeHead(404); res.end(); }
    return;
  }
  // Your own files from the media folder (background, music, sounds).
  if (u.pathname === '/media/list') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({ background: listMedia('background'), music: listMedia('music'), sounds: listMedia('sounds') }));
    return;
  }
  if (u.pathname.startsWith('/media/')) {
    let f;
    try { f = path.normalize(path.join(MEDIA, decodeURIComponent(u.pathname.slice(7)))); } catch { res.writeHead(400); res.end(); return; }
    if (!f.startsWith(MEDIA + path.sep)) { res.writeHead(403); res.end(); return; }
    fs.stat(f, (e, st) => {
      if (e || !st.isFile()) { res.writeHead(404); res.end(); return; }
      const type = TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream';
      const m = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
      if (m) {
        const s0 = m[1] ? +m[1] : 0, e0 = m[2] ? Math.min(+m[2], st.size - 1) : st.size - 1;
        if (s0 >= st.size || s0 > e0) { res.writeHead(416, { 'Content-Range': `bytes */${st.size}` }); res.end(); return; }
        res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${s0}-${e0}/${st.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': e0 - s0 + 1 });
        fs.createReadStream(f, { start: s0, end: e0 }).pipe(res);
      } else {
        res.writeHead(200, { 'Content-Type': type, 'Content-Length': st.size, 'Accept-Ranges': 'bytes' });
        fs.createReadStream(f).pipe(res);
      }
    });
    return;
  }
  if (u.pathname === '/' || u.pathname === '/index.html') {
    fs.readFile(GAME, (e, b) => {
      if (e) { res.writeHead(500); res.end('arena-rush.html not found. Put it next to the tiktok-server folder.'); return; }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(b);
    });
    return;
  }
  res.writeHead(404); res.end();
});

const wss = new WebSocketServer({ server });
const send = o => { const s = JSON.stringify(o); wss.clients.forEach(c => c.readyState === 1 && c.send(s)); };
let status = 'Waiting for a TikTok username', connected = false;
const setStatus = m => { status = m; console.log(m); send({ t: 'status', msg: m }); };
wss.on('connection', ws => {
  console.log('Game screen connected');
  ws.send(JSON.stringify({ t: 'status', msg: status }));
  ws.on('message', raw => {
    try {
      const o = JSON.parse(raw);
      if (o.cmd !== 'connect' || !o.user) return;
      const u = String(o.user).replace(/^@/, '').trim();
      if (!u) return;
      if (process.env.ADMIN_KEY && o.key !== process.env.ADMIN_KEY) { ws.send(JSON.stringify({ t: 'status', msg: 'Wrong admin key: open the game link with ?key=YOUR_KEY' })); return; }
      if (u === username && (connected || retry)) { ws.send(JSON.stringify({ t: 'status', msg: status })); return; }
      username = u; restart();
    } catch {}
  });
});

// Reads user info from both old and new library event formats.
const pickUrl = v => {
  if (!v) return;
  if (typeof v === 'string') return v;
  const l = Array.isArray(v) ? v : (v.urlList || v.url_list || v.urls || v.url);
  if (Array.isArray(l)) return l.find(s => typeof s === 'string' && !/\.heic/i.test(s)) || l[0];
  if (typeof l === 'string') return l;
};
let noPic = 0;
const who = d => {
  const u = d.user || d;
  const pic = u.profilePictureUrl || pickUrl(d.userDetails?.profilePictureUrls) || pickUrl(u.profilePicture)
    || pickUrl(u.avatarThumb) || pickUrl(u.avatarMedium) || pickUrl(u.avatarLarger) || pickUrl(u.avatarLarge);
  if (!pic && noPic++ < 3) console.log('No profile picture found for a viewer. Fields:', Object.keys(u).join(', '));
  return { uid: String(u.uniqueId || u.userId || u.id || ''), name: u.nickname || u.uniqueId || '', pic };
};

// Streakable gifts (like Rose) arrive repeatedly with a growing count; only send the new part.
const streak = {};
let giftWarn = 0;
function onGift(d) {
  const u = d.user || d, g = d.giftDetails || d.gift || {};
  let coins = d.diamondCount ?? g.diamondCount ?? g.diamond_count ?? d.extendedGiftInfo?.diamond_count;
  const name = d.giftName ?? g.giftName ?? g.name ?? 'gift';
  if (coins == null) { if (giftWarn++ < 3) console.log('Gift without a coin value, counted as 1 coin. Fields:', Object.keys(d).join(', ')); coins = 1; }
  const type = d.giftType ?? g.giftType, cnt = d.repeatCount || 1;
  const k = (u.uniqueId || u.userId) + ':' + (d.giftId ?? g.id ?? name);
  let n = cnt;
  if (type === 1 || type == null) {
    const last = streak[k] || 0;
    n = cnt > last ? cnt - last : (d.repeatEnd ? 0 : cnt);
    if (d.repeatEnd) delete streak[k]; else streak[k] = cnt;
  }
  if (n > 0) { const w = who(d); send({ t: 'gift', coins, n, ...w }); console.log(`Gift: ${w.name} sent ${name} x${n} (${coins} coins each)`); }
}

let live = null, retry = null;
function later() { if (retry) return; retry = setTimeout(() => { retry = null; start(); }, 10000); }
function restart() {
  if (retry) { clearTimeout(retry); retry = null; }
  if (live) { try { live.removeAllListeners && live.removeAllListeners(); live.disconnect(); } catch {} live = null; }
  connected = false; start();
}
function start() {
  if (!username) { setStatus('Waiting for a TikTok username'); return; }
  const me = new Conn(username, process.env.SIGN_API_KEY ? { signApiKey: process.env.SIGN_API_KEY } : {});
  live = me;
  setStatus(`Connecting to @${username}...`);
  me.on('member', d => send({ t: 'join', ...who(d) }));
  me.on('chat', d => send({ t: 'join', ...who(d) }));
  me.on('like', d => { const w = who(d), n = d.likeCount || d.count || 1; send({ t: 'like', n, ...w }); console.log(`Like: ${w.name} +${n}`); });
  me.on('gift', onGift);
  me.on('disconnected', () => { if (live !== me) return; connected = false; setStatus('Disconnected from TikTok, retrying in 10s'); later(); });
  me.on('streamEnd', () => { if (live === me) setStatus('Stream ended'); });
  me.connect()
    .then(r => { if (live !== me) return; connected = true; setStatus(`Connected to @${username} LIVE`); })
    .catch(e => { if (live !== me) return; setStatus(`Could not connect to @${username} (${e?.message || e}). Make sure you are LIVE. Retrying in 10s`); later(); });
}

// On a cloud host (PORT is set) listen publicly; on your PC only locally.
const LISTEN_PORT = +process.env.PORT || PORT, HOST = process.env.PORT ? '0.0.0.0' : '127.0.0.1';
server.listen(LISTEN_PORT, HOST, () => {
  console.log(process.env.PORT ? `Game server running on port ${LISTEN_PORT}` : `Game screen: http://localhost:${PORT}/`);
  if (username) start(); else console.log('Open the game and type your TikTok username in the admin panel.');
});
