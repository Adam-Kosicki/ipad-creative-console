// Runs a series of "what if we switch X off" experiments in the page and records idle fps and swipe fps for each.
// Paste into /__dbg/eval on the Home page, then poll `JSON.stringify(window.__exp)` until it ends with "done".
(function () {
  var EXPS = [
    ['base', ''],
    ['nothing-at-all', '#pager,#dots,#ptitle{display:none!important}body::before{display:none!important}'],
    ['no-body-glow', 'body::before{display:none!important}'],
    ['no-body-glow+no-bg', 'body::before{display:none!important}*{background-image:none!important}'],
    ['no-canvas', 'canvas{display:none!important}'],
    ['no-bg-gradients', '*{background-image:none!important}'],
    ['no-radius', '*{border-radius:0!important}'],
    ['no-borders', '*{border-color:transparent!important}'],
    ['page-layers', '#pager>*{-webkit-transform:translateZ(0);-webkit-backface-visibility:hidden}'],
    ['no-canvas+no-bg', 'canvas{display:none!important}*{background-image:none!important}'],
    ['hide-all-but-bg', '.w{visibility:hidden!important}'],
  ];
  window.__exp = [];
  function frames(ms, cb) {
    var t = [], last = 0, end = Date.now() + ms;
    (function loop(ts) { if (last) t.push(ts - last); last = ts; if (Date.now() < end) requestAnimationFrame(loop); else cb(t); })(0);
  }
  function stat(t) {
    t = t.slice(1); if (!t.length) return null;
    var s = 0; t.forEach(function (x) { s += x; }); var o = t.slice().sort(function (a, b) { return a - b; });
    return { fps: Math.round(1000 / (s / t.length) * 10) / 10, p95: Math.round(o[Math.floor(o.length * 0.95)]) };
  }
  var i = 0;
  function next() {
    if (i >= EXPS.length) { window.__exp.push('done'); return; }
    var e = EXPS[i++], st = document.createElement('style'); st.textContent = e[1]; document.head.appendChild(st);
    setTimeout(function () {
      frames(2000, function (idle) {
        frames(1800, function (sw) {
          st.parentNode.removeChild(st);
          window.__exp.push([e[0], 'idle', stat(idle), 'swipe', stat(sw)]);
          setTimeout(next, 600);
        });
        if (window.__dbg && __dbg.swipe) { __dbg.swipe(900, 400, 100, 400, 350); setTimeout(function () { __dbg.swipe(100, 400, 900, 400, 350); }, 800); }
      });
    }, 500);
  }
  next();
  return 'running';
})();
