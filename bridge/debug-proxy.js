// Remote debugging for the iPad, so the PC (or Claude) can see errors and drive the page without someone holding the iPad.
// Usage: node bridge/debug-proxy.js   (with bridge/server.js already running)
// The iPad opens http://<pc-ip>:8801 instead of :8800. Everything is passed through to the bridge, and every HTML page
// gets bridge/debug-client.js injected first, which sends console output and errors here and runs commands from here.
//
// iPad side (no token, like the pages themselves):   /__dbg/client.js  /__dbg/log  /__dbg/poll  /__dbg/result
// Control side (needs ?k=<key> or header X-Debug-Key; the key is in bridge/.debug-key):
//   GET  /__dbg/                 small console page (log + eval box)
//   GET  /__dbg/logs?since=N     log entries after seq N (JSON)
//   GET  /__dbg/clients          connected iPads
//   POST /__dbg/eval             body = JS; runs on the iPad, answers with the result
//   POST /__dbg/reload           reloads the page on the iPad
//   GET  /__dbg/snapshot         the iPad's current DOM, viewport size and scroll (JSON)
//   GET  /__dbg/outline          visible elements with their boxes, as text
//   GET  /__dbg/screenshot       a real screenshot over USB (PNG), when DEBUG_SCREENSHOT_CMD or pymobiledevice3 works
// Everything logged is also appended to bridge/.debug/log.jsonl.
var http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto'), url = require('url'),
  os = require('os'), cp = require('child_process');
var PORT = parseInt(process.env.DEBUG_PORT || '8801', 10);
var BRIDGE_PORT = parseInt(process.env.BRIDGE_PORT || '8800', 10);
var DIR = path.join(__dirname, '.debug');
try { fs.mkdirSync(DIR); } catch (_) {}
var LOG_FILE = path.join(DIR, 'log.jsonl');
var KEY_FILE = path.join(__dirname, '.debug-key');
var KEY = process.env.DEBUG_KEY || (function () {
  try { var k = fs.readFileSync(KEY_FILE, 'utf8').trim(); if (k) return k; } catch (_) {}
  var n = crypto.randomBytes(9).toString('hex');
  fs.writeFileSync(KEY_FILE, n + '\n', { mode: 384 });
  return n;
})();
var CLIENT = path.join(__dirname, 'debug-client.js');
var INJECT = '<script src="/__dbg/client.js"></script>';

var logs = [], nextSeq = 0;
function addLog(e) {
  e.seq = ++nextSeq;
  logs.push(e);
  if (logs.length > 5000) logs.splice(0, 1000);
  fs.appendFile(LOG_FILE, JSON.stringify(e) + '\n', function () {});
  var tag = e.kind === 'error' ? 'ERR ' : e.kind === 'warn' ? 'WARN' : '    ';
  console.log(tag + ' [' + (e.client || '-') + '] ' + e.text.split('\n')[0].slice(0, 200) + (e.src ? '  (' + e.src + ':' + e.line + ')' : ''));
}

// iPads seen recently, their command queues and the poll waiting for commands
var clients = {};
function client(cid, ua) {
  var c = clients[cid] || (clients[cid] = { id: cid, ua: ua, queue: [], waiting: null, seen: 0 });
  c.seen = Date.now(); if (ua) c.ua = ua;
  return c;
}
function live() {
  var out = [], now = Date.now();
  for (var k in clients) if (now - clients[k].seen < 40000 || clients[k].waiting) out.push(clients[k]);
  out.sort(function (a, b) { return b.seen - a.seen; });
  return out;
}
var pending = {}, cmdSeq = 0;
// Send a command to the newest iPad (or ?client=), wait for its answer.
function command(cmd, target, timeout, cb) {
  var list = live(), c = target ? clients[target] : list[0];
  if (!c) return cb(503, { error: 'no iPad connected: open http://<pc-ip>:' + PORT + ' on it' });
  cmd.id = ++cmdSeq;
  var done = false;
  var timer = setTimeout(function () { finish(504, { error: 'iPad did not answer in ' + timeout / 1000 + 's' }); }, timeout);
  function finish(code, body) { if (done) return; done = true; clearTimeout(timer); delete pending[cmd.id]; cb(code, body); }
  pending[cmd.id] = function (r) { finish(200, r); };
  c.queue.push(cmd);
  if (c.waiting) { var w = c.waiting; c.waiting = null; w(); }
}

function send(res, code, type, body, extra) {
  var h = { 'Content-Type': type, 'Cache-Control': 'no-store' };
  for (var k in extra || {}) h[k] = extra[k];
  res.writeHead(code, h); res.end(body);
}
function json(res, code, v) { send(res, code, 'application/json', JSON.stringify(v, null, 1)); }
function body(req, cb) { var b = ''; req.on('data', function (d) { b += d; if (b.length > 5e6) req.destroy(); }); req.on('end', function () { cb(b); }); }
function same(a, b) { a = Buffer.from(String(a || '')); b = Buffer.from(String(b)); return a.length === b.length && crypto.timingSafeEqual(a, b); }

// Pass a request to the bridge; inject the debug client into HTML.
function proxy(req, res) {
  var headers = {};
  for (var k in req.headers) headers[k] = req.headers[k];
  delete headers['accept-encoding'];
  var up = http.request({ host: '127.0.0.1', port: BRIDGE_PORT, path: req.url, method: req.method, headers: headers }, function (br) {
    var type = String(br.headers['content-type'] || '');
    if (type.indexOf('text/html') !== 0) { res.writeHead(br.statusCode, br.headers); return br.pipe(res); }
    var chunks = [];
    br.on('data', function (d) { chunks.push(d); });
    br.on('end', function () {
      var html = Buffer.concat(chunks).toString('utf8');
      html = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, function (m) { return m + INJECT; }) : INJECT + html;
      var h = {};
      for (var k in br.headers) h[k] = br.headers[k];
      h['content-length'] = Buffer.byteLength(html);
      h['cache-control'] = 'no-store';
      res.writeHead(br.statusCode, h); res.end(html);
    });
  });
  up.on('error', function () { if (!res.headersSent) send(res, 502, 'text/plain', 'bridge not running on port ' + BRIDGE_PORT); else res.end(); });
  res.on('close', function () { up.destroy(); });
  req.pipe(up);
}

function screenshot(res) {
  var out = path.join(DIR, 'screen.png');
  try { fs.unlinkSync(out); } catch (_) {}
  // pymobiledevice3 is often installed with pip --user, off PATH; try the usual ways to start it
  var py = path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'Python', 'Python311', 'python.exe');
  var cmds = process.env.DEBUG_SCREENSHOT_CMD ? [process.env.DEBUG_SCREENSHOT_CMD] : [
    'pymobiledevice3 developer screenshot "{out}"', '"' + py + '" -m pymobiledevice3 developer screenshot "{out}"',
    'py -m pymobiledevice3 developer screenshot "{out}"', 'python -m pymobiledevice3 developer screenshot "{out}"',
    'pymobiledevice3 developer dvt screenshot "{out}"'];
  var errors = [];
  (function next(i) {
    if (i >= cmds.length) return json(res, 500, { error: 'screenshot failed (iPad on USB, trusted, Apple driver installed?)', tried: errors });
    var cmd = cmds[i].replace('{out}', out);
    cp.exec(cmd, { timeout: 30000, windowsHide: true }, function (err, stdout, stderr) {
      fs.readFile(out, function (e2, png) {
        if (!e2) return send(res, 200, 'image/png', png);
        errors.push({ cmd: cmd, detail: String(stderr || stdout || (err && err.message) || '').slice(-600) });
        next(i + 1);
      });
    });
  })(0);
}

var PAGE = '<!doctype html><meta charset=utf-8><title>iPad debug</title><style>body{font:13px monospace;margin:0;background:#111;color:#ddd}' +
  '#log{white-space:pre-wrap;padding:8px;height:calc(100vh - 90px);overflow:auto}.error{color:#f66}.warn{color:#fc6}.r{color:#6cf}' +
  'textarea{width:100%;height:60px;box-sizing:border-box;background:#222;color:#fff;border:0;padding:6px}</style>' +
  '<div id=log></div><textarea id=c placeholder="JS to run on the iPad. Ctrl+Enter runs. __dbg.tap(\'#id\'), __dbg.outline()"></textarea>' +
  '<button onclick=go("eval")>Run</button> <button onclick=go("reload")>Reload iPad</button> <button onclick=go("outline")>Outline</button>' +
  ' <a href="screenshot?k=KEY" target=_blank style=color:#6cf>Screenshot</a><script>var k="KEY",s=0,L=document.getElementById("log");' +
  'function add(t,c){var d=document.createElement("div");d.className=c||"";d.textContent=t;L.appendChild(d);L.scrollTop=1e9}' +
  'function tick(){fetch("logs?k="+k+"&since="+s).then(r=>r.json()).then(a=>{a.forEach(e=>{s=e.seq;add(new Date(e.t).toLocaleTimeString()+" "+e.text+(e.src?"  ("+e.src+":"+e.line+")":""),e.kind)})}).catch(()=>{}).then(()=>setTimeout(tick,1000))}tick();' +
  'function go(t){var c=document.getElementById("c").value;fetch(t+"?k="+k,{method:t=="outline"?"GET":"POST",body:t=="outline"?undefined:c}).then(r=>r.text()).then(x=>add("> "+x,"r"))}' +
  'document.getElementById("c").onkeydown=e=>{if(e.key=="Enter"&&e.ctrlKey)go("eval")}</script>';

http.createServer(function (req, res) {
  var u = url.parse(req.url, true), p = u.pathname;
  // home network only: the bridge sees every request as coming from this PC
  if (!/^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.)|^::1$/.test(String(req.socket.remoteAddress).replace(/^::ffff:/, '')))
    return send(res, 403, 'text/plain', 'home network only');
  if (p.indexOf('/__dbg/') !== 0) return proxy(req, res);

  // iPad side
  if (p === '/__dbg/client.js') return fs.readFile(CLIENT, function (e, d) { send(res, e ? 404 : 200, 'text/javascript; charset=utf-8', d || ''); });
  if (p === '/__dbg/log' && req.method === 'POST') return body(req, function (b) {
    var ip = String(req.socket.remoteAddress).replace(/^::ffff:/, '');
    try { JSON.parse(b).forEach(function (e) { client(e.client).ip = ip; addLog({ t: e.t, client: e.client, kind: e.kind, text: String(e.text), src: e.src, line: e.line, col: e.col, url: e.url }); }); } catch (_) {}
    json(res, 200, { ok: true });
  });
  if (p === '/__dbg/poll') {
    var c = client(String(u.query.client || 'unknown'), u.query.ua);
    var reply = function () { var q = c.queue.splice(0); json(res, 200, q); };
    if (c.queue.length) return reply();
    var t = setTimeout(function () { c.waiting = null; reply(); }, 25000);
    c.waiting = function () { clearTimeout(t); reply(); };
    res.on('close', function () { clearTimeout(t); if (c.waiting) c.waiting = null; c.seen = Date.now(); });
    return;
  }
  if (p === '/__dbg/result' && req.method === 'POST') return body(req, function (b) {
    try { var r = JSON.parse(b); if (pending[r.cmd]) pending[r.cmd](r); } catch (_) {}
    json(res, 200, { ok: true });
  });

  // control side
  if (!same(u.query.k || req.headers['x-debug-key'], KEY)) return send(res, 403, 'text/plain', 'forbidden: add ?k=<key from bridge/.debug-key>');
  var target = u.query.client;
  if (p === '/__dbg/') return send(res, 200, 'text/html; charset=utf-8', PAGE.replace(/KEY/g, KEY));
  if (p === '/__dbg/logs') {
    var since = parseInt(u.query.since || '0', 10);
    return json(res, 200, logs.filter(function (e) { return e.seq > since; }).slice(-1000));
  }
  if (p === '/__dbg/clients') return json(res, 200, live().map(function (c) { return { id: c.id, ip: c.ip, ua: c.ua, seenAgoMs: Date.now() - c.seen }; }));
  if (p === '/__dbg/eval' && req.method === 'POST') return body(req, function (code) {
    command({ type: 'eval', code: code }, target, 15000, function (s, r) { json(res, s, r); });
  });
  if (p === '/__dbg/reload' && req.method === 'POST') return command({ type: 'reload' }, target, 5000, function (s, r) { json(res, s, r); });
  if (p === '/__dbg/outline') return command({ type: 'eval', code: '__dbg.outline(' + JSON.stringify(u.query.root || 'body') + ')' }, target, 15000,
    function (s, r) { send(res, s, 'text/plain; charset=utf-8', r.value || JSON.stringify(r)); });
  if (p === '/__dbg/snapshot') return command({ type: 'snapshot' }, target, 15000, function (s, r) {
    if (s === 200 && r.ok) { fs.writeFile(path.join(DIR, 'snapshot.json'), r.value, function () {}); return send(res, 200, 'application/json', r.value); }
    json(res, s, r);
  });
  if (p === '/__dbg/screenshot') return screenshot(res);
  send(res, 404, 'text/plain', 'not found');
}).listen(PORT, '0.0.0.0', function () {
  var ips = [], nets = os.networkInterfaces();
  for (var n in nets) nets[n].forEach(function (a) { if (a.family === 'IPv4' && !a.internal) ips.push(a.address); });
  ips.sort(function (a, b) { return (b.indexOf('192.168.') === 0) - (a.indexOf('192.168.') === 0); });
  console.log('iPad debug proxy. On the iPad open:  http://' + (ips[0] || '<pc-ip>') + ':' + PORT);
  console.log('Debug console on this PC:           http://localhost:' + PORT + '/__dbg/?k=' + KEY);
});
