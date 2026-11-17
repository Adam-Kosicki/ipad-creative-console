// LAN bridge for old iPads. Zero dependencies. Usage: BRIDGE_TOKEN=secret node bridge/server.js
//   /          small ES5 page: Claude allow/deny + quotas (bridge/index.html)
//   /panel/    PhoneBox's full panel, rebuilt for iOS 10 by scripts/build-panel.mjs (bridge/panel/)
//   /agent/*   the panel's API calls, forwarded to the PhoneBox agent on 127.0.0.1:8765 (only the paths the agent
//              itself allows over Wi-Fi, see PhoneBox Lan.AllowedOverLan)
// Every request needs the token: ?t=<token> once, after which a cookie carries it.
// BRIDGE_OPEN_LAN=1 drops the token for devices on the local network (private IPs only), so the iPad link is just
// http://<pc-ip>:8800. Anyone on that Wi-Fi can then use the panel, including Claude allow/deny.
var http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto'), url = require('url');
var PORT = parseInt(process.env.BRIDGE_PORT || '8800', 10);
var AGENT_HOST = process.env.AGENT_HOST || '127.0.0.1';
var AGENT_PORT = parseInt(process.env.AGENT_PORT || '8765', 10);
// Kept in bridge/.token so the iPad's saved link and cookie keep working after a restart.
var TOKEN_FILE = path.join(__dirname, '.token');
var TOKEN = process.env.BRIDGE_TOKEN || (function () {
  try { var t = fs.readFileSync(TOKEN_FILE, 'utf8').trim(); if (t) return t; } catch (_) {}
  var n = crypto.randomBytes(9).toString('hex');
  try { fs.writeFileSync(TOKEN_FILE, n + '\n', { mode: 384 }); } catch (_) {}
  return n;
})();
var OPEN_LAN = process.env.BRIDGE_OPEN_LAN === '1';
var PAGE = path.join(__dirname, 'index.html');
var PANEL = process.env.BRIDGE_PANEL_DIR ? path.resolve(process.env.BRIDGE_PANEL_DIR) : path.join(__dirname, 'panel'); // override for side-by-side tests
// What the agent sees: a phone named "iPad", so it queues Claude approvals and lists the device in its settings.
var PHONE_HEADERS = { 'X-PhoneBox-App': 'ipad-bridge', 'X-PhoneBox-Device': 'ipad-bridge', 'X-PhoneBox-Model': 'iPad (bridge)' };

// Mirrors PhoneBox's Lan.AllowedOverLan (agent 0.9.x), without pairing and webhooks.
var EXACT = ['/api/controls/spotify/state', '/api/controls/state', '/api/controls/listen', '/api/dictate', '/api/camera', '/api/spectrum'];
var PREFIX = ['/api/controls/spotify/action', '/api/controls/radio-logo', '/api/controls/command', '/api/controls/obs', '/api/state',
  '/api/config', '/api/art', '/api/media', '/api/volume', '/api/quotas', '/api/work', '/api/procs', '/api/run', '/api/apps',
  '/api/shortcuts/icon', '/api/console', '/api/widget', '/api/calendar', '/api/feeds', '/api/photos', '/api/docker', '/api/obs',
  '/api/discord', '/api/batteries', '/api/ha/states', '/api/ha/toggle', '/api/approvals', '/api/rules/pause', '/api/phone/battery',
  '/api/stream'];
// Read-only extras the panel needs that the agent only serves over USB: pushed webhook values and its weather/feed
// proxy (which has its own host allowlist).
var GET_ONLY = ['/api/push', '/api/proxy'];
function allowed(p, method) {
  if (method === 'GET' && GET_ONLY.indexOf(p) >= 0) return true;
  if (EXACT.indexOf(p) >= 0) return true;
  for (var i = 0; i < PREFIX.length; i++) if (p === PREFIX[i] || p.indexOf(PREFIX[i] + '/') === 0) return true;
  return false;
}

function agent(method, p, cb) {
  var req = http.request({ host: AGENT_HOST, port: AGENT_PORT, path: p, method: method, headers: PHONE_HEADERS }, function (res) {
    var b = ''; res.on('data', function (d) { b += d; });
    res.on('end', function () { cb(null, res.statusCode, b); });
  });
  req.on('error', function (e) { cb(e); });
  req.setTimeout(4000, function () { req.destroy(new Error('agent timeout')); });
  req.end();
}
// Presence heartbeat: the agent only queues approvals while a "phone" polled /api/state recently.
setInterval(function () { agent('GET', '/api/state', function () {}); }, 2000);

function send(res, code, type, body, extra) {
  var h = { 'Content-Type': type, 'Cache-Control': 'no-store' };
  for (var k in extra || {}) h[k] = extra[k];
  res.writeHead(code, h); res.end(body);
}
function cookie(req, name) {
  var m = new RegExp('(?:^|;\\s*)' + name + '=([^;]*)').exec(req.headers.cookie || '');
  return m ? decodeURIComponent(m[1]) : null;
}
function privateIp(ip) {
  ip = String(ip || '').replace(/^::ffff:/, '');
  return /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.)/.test(ip) || ip === '::1' || /^f[cd]|^fe80:/i.test(ip);
}
function same(a, b) {
  a = Buffer.from(String(a || '')); b = Buffer.from(String(b));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// The panel's API: stream the request and the answer through (also /api/stream, which is server-sent events).
function proxy(req, res, p, search) {
  var headers = {};
  for (var k in PHONE_HEADERS) headers[k] = PHONE_HEADERS[k];
  ['content-type', 'content-length', 'accept', 'range'].forEach(function (h) { if (req.headers[h]) headers[h] = req.headers[h]; });
  headers.host = AGENT_HOST + ':' + AGENT_PORT; // the agent rejects any other Host (DNS rebinding guard)
  var up = http.request({ host: AGENT_HOST, port: AGENT_PORT, path: p + (search || ''), method: req.method, headers: headers }, function (ar) {
    var h = {};
    ['content-type', 'content-length', 'cache-control', 'content-encoding', 'x-accel-buffering'].forEach(function (k) { if (ar.headers[k]) h[k] = ar.headers[k]; });
    res.writeHead(ar.statusCode, h);
    ar.pipe(res);
  });
  up.on('error', function () { if (!res.headersSent) send(res, 502, 'application/json', '{"error":"agent unreachable"}'); else res.end(); });
  res.on('close', function () { up.destroy(); });
  req.pipe(up);
}

var TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.woff': 'font/woff' };
function serveStatic(res, root, rel) {
  var file = path.normalize(path.join(root, rel || 'index.html'));
  if (file.indexOf(root + path.sep) !== 0 && file !== root) return send(res, 403, 'text/plain', 'forbidden');
  fs.readFile(file, function (err, data) {
    if (err) return send(res, 404, 'text/plain', root === PANEL && !fs.existsSync(PANEL)
      ? 'panel not built: run node scripts/build-panel.mjs <phonebox clone>' : 'not found');
    send(res, 200, TYPES[path.extname(file)] || 'application/octet-stream', data);
  });
}

http.createServer(function (req, res) {
  var u = url.parse(req.url, true);
  var viaQuery = same(u.query.t, TOKEN);
  var lanOk = OPEN_LAN && privateIp(req.socket.remoteAddress);
  if (!viaQuery && !lanOk && !same(cookie(req, 'bt'), TOKEN)) return send(res, 403, 'text/plain', 'forbidden: open the URL with ?t=<token>');
  var setCookie = viaQuery ? { 'Set-Cookie': 'bt=' + encodeURIComponent(TOKEN) + '; Path=/; Max-Age=31536000; HttpOnly; SameSite=Strict' } : null;
  var p = u.pathname;
  // redirects to the panel drop the token from the address bar but keep other options (?lite=0|1)
  var rest = Object.keys(u.query).filter(function (k) { return k !== 't'; })
    .map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(u.query[k]); }).join('&');
  var panelUrl = '/panel/' + (rest ? '?' + rest : '');

  // the short link: http://<pc-ip>:8800 opens the panel; the simple approvals page is at /simple
  if (p === '/') return send(res, 302, 'text/plain', '', { Location: panelUrl, 'Set-Cookie': setCookie && setCookie['Set-Cookie'] });
  if (p === '/simple') return send(res, 200, 'text/html; charset=utf-8', fs.readFileSync(PAGE), setCookie);
  if (p === '/panel') return send(res, 302, 'text/plain', '', { Location: panelUrl, 'Set-Cookie': setCookie && setCookie['Set-Cookie'] });
  if (p.indexOf('/panel/') === 0) {
    if (setCookie && p === '/panel/') return send(res, 302, 'text/plain', '', { Location: panelUrl, 'Set-Cookie': setCookie['Set-Cookie'] });
    return serveStatic(res, PANEL, decodeURIComponent(p.slice(7)));
  }
  if (p.indexOf('/bench/') === 0) return serveStatic(res, path.join(__dirname, 'bench'), decodeURIComponent(p.slice(7)));   // swipe benchmark pages
  if (p.indexOf('/agent/') === 0) {
    var ap = p.slice(6);
    if (!allowed(ap, req.method)) return send(res, 403, 'application/json', '{"error":"not allowed from the iPad"}');
    // drop the bridge token from what the agent sees
    var q = (u.search || '').replace(/([?&])t=[^&]*&?/, '$1').replace(/[?&]$/, '');
    return proxy(req, res, ap, q);
  }

  // the small page's API
  var m;
  if (p === '/api/approvals' && req.method === 'GET') return fwd('GET', '/api/approvals');
  if (p === '/api/quotas' && req.method === 'GET') return fwd('GET', '/api/quotas');
  if (req.method === 'POST' && (m = /^\/api\/approvals\/([0-9a-f]+)$/.exec(p)) && /^(allow|deny|skip)$/.test(u.query.decision || ''))
    return fwd('POST', '/api/approvals/' + m[1] + '?decision=' + u.query.decision);
  send(res, 404, 'text/plain', 'not found');
  function fwd(method, ap) {
    agent(method, ap, function (err, code, body) {
      if (err) return send(res, 502, 'application/json', '{"error":"agent unreachable"}');
      send(res, code, 'application/json', body || '{}');
    });
  }
}).listen(PORT, '0.0.0.0', function () {
  var ips = [], nets = require('os').networkInterfaces();
  for (var n in nets) nets[n].forEach(function (a) { if (a.family === 'IPv4' && !a.internal && privateIp(a.address)) ips.push(a.address); });
  var host = ips[0] || '<pc-ip>';
  console.log('On the iPad, open:');
  if (OPEN_LAN) console.log('  http://' + host + ':' + PORT + '      (no token needed on this network)');
  else console.log('  http://' + host + ':' + PORT + '/?t=' + TOKEN);
  console.log('  (simple approvals page: /simple)' + (ips.length > 1 ? '   other addresses of this PC: ' + ips.slice(1).join(', ') : ''));
});
