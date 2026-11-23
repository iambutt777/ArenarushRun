// Builds android-app/www from the game file and the media folder.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..', '..'), www = path.join(__dirname, '..', 'www');
const AUDIO = /\.(mp3|wav|ogg|m4a|aac)$/i, BG = /\.(mp4|webm|mov|m4v|jpe?g|png|webp|gif)$/i;
fs.rmSync(www, { recursive: true, force: true });
fs.mkdirSync(www, { recursive: true });
fs.copyFileSync(path.join(root, 'arena-rush.html'), path.join(www, 'index.html'));
const list = d => { try { return fs.readdirSync(path.join(root, 'media', d)).filter(f => (d === 'background' ? BG : AUDIO).test(f)).sort(); } catch { return []; } };
const media = { background: list('background'), music: list('music'), sounds: list('sounds') };
if (fs.existsSync(path.join(root, 'media'))) fs.cpSync(path.join(root, 'media'), path.join(www, 'media'), { recursive: true });
fs.mkdirSync(path.join(www, 'media'), { recursive: true });
fs.writeFileSync(path.join(www, 'media', 'list.json'), JSON.stringify(media));
console.log('www ready:', JSON.stringify(media));
