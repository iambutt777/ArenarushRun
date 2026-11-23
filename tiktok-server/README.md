# Arena Rush on TikTok LIVE

## Folder layout
Keep the files like this:
  arena-rush.html
  tiktok-server/  (server.js, package.json, README.md)
  media/
    background/   your background video or picture
    music/        your music files (added to the playlist)
    sounds/       your own effect sounds (thunder.mp3, king.mp3 ...)
Each media folder has a README.txt with the exact file names. These files only load when the game
is opened through the bridge at http://localhost:8787/.

## One-time setup
1. Install Node.js 18 or newer (LTS) from nodejs.org.
2. Open a terminal in the tiktok-server folder and run: npm install

## Every stream
1. In the tiktok-server folder run: node server.js
   (or node server.js YOUR_TIKTOK_USERNAME to connect straight away)
2. Open http://localhost:8787/ in Chrome, or add it to OBS as a Browser Source (1080 x 1920).
3. In the admin panel on the left, type your TikTok username and press Connect.
   Go LIVE on TikTok; the bridge keeps retrying every 10 seconds until your LIVE is found.
4. Set timings, background video, music and effect sounds in the panel. Timings are saved automatically.
5. Press Hide (or the H key) before streaming. The small button in the top-left corner brings the panel back.
   In OBS, use the Browser Source's Interact button to use the panel.

The game is a vertical 9:16 screen. On a wide monitor it sits in the middle; on an Android phone it fills the screen.
Video and music files must be chosen again each time the page is reloaded.

If the connection keeps failing, the library may need a signing key. Get a free key from the
tiktok-live-connector project page and start with: SIGN_API_KEY=yourkey node server.js
(on Windows PowerShell: $env:SIGN_API_KEY="yourkey"; node server.js)

## Run it online with a link (cloud hosting)
You can host the whole game on a free cloud service such as Render, so it has its own web link.
1. Put the arena-rush folder (arena-rush.html, package.json, tiktok-server, media) in a GitHub repository.
2. On render.com create a new Web Service from that repository:
   - Build command: npm install
   - Start command: npm start
   - Environment variable ADMIN_KEY = any secret word (protects the Connect button)
3. When it is live, open https://YOUR-APP.onrender.com/?key=YOUR_SECRET in OBS or Chrome,
   type your TikTok username in the admin panel and press Connect.
Notes: free plans fall asleep when unused, so open the link a minute before streaming.
TikTok may block cloud servers more often than home internet; if it cannot connect, add SIGN_API_KEY too.
Anyone can watch the link, but only someone with the key can change the connected username.

## Testing without going live
Open arena-rush.html#demo. Keyboard: H = hide panel, L = like, T = thunder,
1 Rose, 2 Finger Heart, 3 Rosa, 4 Perfume, 5 Doughnut, 6 Spinner, 7 Ice Age, 8 King, 9 Chain Devourer.

Gift tiers (coins per gift):
- 1-4 = rose: +80 points, +5s saw each (stacks), each rose speeds up the bubble and saw (max 3x).
- 5-9 = finger heart: +400 points, 20s red saw, 10s gravity circle (3x stronger: bigger, traps about 3x more bubbles).
- 10-19 = rosa: +800 points, 30s aura, 8s fireball storm and a final bloom.
- 20-29 = perfume: +1200 points, 40s red saw, 25s of shooting bullets at nearby bubbles.
- 30-99 = doughnut: +2000 points, 60s yellow saw, multicolor thunder on 8-9 random bubbles, then 8s fast move (250) and a 25s dash.
- 100-298 = ice age: +4000 points, freezes everyone for 5s, then ice touch and crystals.
- 299+ = chain devourer: +12000 points, chains and eats every bubble under 5K points.
- King: when a viewer sends 100 single 1-coin gifts in one round (even spread out over time), they become King for 20s. Bigger gifts do not count.
Big score: a bubble reaching 18,000 points gets a saw for 5 minutes (50% damage) while it stays above 18,000.

This uses the unofficial tiktok-live-connector library. TikTok changes can break it, and it may not fit TikTok's terms.
