// LAN bridge: serves an ES5 page for old iPads and proxies PhoneBox agent calls.
// Zero dependencies. Usage: BRIDGE_TOKEN=secret node bridge/server.js
var http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
var PORT = parseInt(process.env.BRIDGE_PORT || '8800', 10);
var AGENT_HOST = process.env.AGENT_HOST || '127.0.0.1';
var AGENT_PORT = parseInt(process.env.AGENT_PORT || '8765', 10);
var TOKEN = process.env.BRIDGE_TOKEN || crypto.randomBytes(6).toString('hex');
var PAGE = path.join(__dirname, 'index.html');

function agent(method, p, cb) {
  var req = http.request({ host: AGENT_HOST, port: AGENT_PORT, path: p, method: method,
    headers: { 'X-PhoneBox-App': 'ipad-bridge' } }, function (res) {
    var b = ''; res.on('data', function (d) { b += d; });
    res.on('end', function () { cb(null, res.statusCode, b); });
  });
  req.on('error', function (e) { cb(e); });
  req.setTimeout(4000, function () { req.destroy(new Error('agent timeout')); });
  req.end();
}
// Presence heartbeat: the agent only queues approvals while a "phone" polled /api/state recently.
setInterval(function () { agent('GET', '/api/state', function () {}); }, 2000);

function send(res, code, type, body) { res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' }); res.end(body); }

http.createServer(function (req, res) {
  var u = require('url').parse(req.url, true);
  if (u.query.t !== TOKEN) return send(res, 403, 'text/plain', 'forbidden');
  if (u.pathname === '/') return send(res, 200, 'text/html; charset=utf-8', fs.readFileSync(PAGE));
  var m;
  if (u.pathname === '/api/approvals' && req.method === 'GET') return fwd('GET', '/api/approvals');
  if (u.pathname === '/api/quotas' && req.method === 'GET') return fwd('GET', '/api/quotas');
  if (req.method === 'POST' && (m = /^\/api\/approvals\/([0-9a-f]+)$/.exec(u.pathname)) &&
      /^(allow|deny|skip)$/.test(u.query.decision || ''))
    return fwd('POST', '/api/approvals/' + m[1] + '?decision=' + u.query.decision);
  send(res, 404, 'text/plain', 'not found');
  function fwd(method, p) {
    agent(method, p, function (err, code, body) {
      if (err) return send(res, 502, 'application/json', '{"error":"agent unreachable"}');
      send(res, code, 'application/json', body || '{}');
    });
  }
}).listen(PORT, '0.0.0.0', function () {
  console.log('Open on the iPad:  http://<pc-ip>:' + PORT + '/?t=' + TOKEN);
});
