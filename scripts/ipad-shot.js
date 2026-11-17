// Screenshot of the iPad over Wi-Fi, no USB: renders the page inside Safari (html2canvas) and saves a PNG.
// Usage: node scripts/ipad-shot.js [out.png]    (debug proxy running, iPad has http://<pc-ip>:8801 open)
// It is a re-drawing of the DOM, not a real screen grab: close, but fonts, shadows and some transforms can differ.
var http = require('http'), fs = require('fs'), path = require('path');
var out = process.argv[2] || path.join(__dirname, '..', 'bridge', '.debug', 'shot.png');
var key = process.env.DEBUG_KEY || fs.readFileSync(path.join(__dirname, '..', 'bridge', '.debug-key'), 'utf8').trim();
var code = '(function(){return new Promise(function(res,rej){function go(){html2canvas(document.documentElement,{width:innerWidth,height:innerHeight,scale:1,logging:false,useCORS:true,backgroundColor:null}).then(function(c){res(c.toDataURL("image/png"))},rej)}' +
  'if(window.html2canvas)return go();var s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";s.onload=go;s.onerror=function(){rej("could not load html2canvas")};document.head.appendChild(s)})})()';
var req = http.request({ host: '127.0.0.1', port: 8801, path: '/__dbg/eval?k=' + key, method: 'POST' }, function (res) {
  var b = ''; res.on('data', function (d) { b += d; });
  res.on('end', function () {
    var r; try { r = JSON.parse(b); } catch (e) { return console.error('bad answer: ' + b.slice(0, 300)); }
    if (!r.ok || !/^data:image\/png;base64,/.test(r.value || '')) return console.error('failed: ' + JSON.stringify(r).slice(0, 500));
    fs.writeFileSync(out, Buffer.from(r.value.split(',')[1], 'base64'));
    console.log('saved ' + out);
  });
});
req.setTimeout(40000); req.on('error', function (e) { console.error(e.message); });
req.end(code);
