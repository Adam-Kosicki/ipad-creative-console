// Round 2 perf experiments (paste into /__dbg/eval on Home; poll JSON.stringify(window.__exp) until 'done').
(function () {
  var GLOW = 'body::before{display:none!important}body{background-image:radial-gradient(60% 80% at 78% 30%,rgba(var(--ambient),.16),transparent 70%),radial-gradient(50% 60% at 10% 100%,rgba(var(--ambient),.06),transparent 70%)!important}';
  var NB_CANVAS = '#pager>.page:not(.pbcur) canvas{visibility:hidden!important}';
  var NB_HIDE = '#pager>.page:not(.pbcur){visibility:hidden!important}';
  var EXPS = [
    ['base', ''],
    ['glow-on-body', GLOW],
    ['neighbour-canvas-hidden', NB_CANVAS],
    ['glow-on-body+neighbour-canvas', GLOW + NB_CANVAS],
    ['neighbours-fully-hidden', NB_HIDE],
    ['glow+neighbours-hidden', GLOW + NB_HIDE],
    ['glow+neighbours-hidden+no-canvas', GLOW + NB_HIDE + 'canvas{visibility:hidden!important}'],
    ['base-again', ''],
  ];
  window.__exp = [];
  var pager = document.getElementById('pager');
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
    var cur = pager.children[Math.round(pager.scrollLeft / innerWidth)]; if (cur) cur.classList.add('pbcur');
    setTimeout(function () {
      frames(2000, function (idle) {
        frames(1800, function (sw) {
          st.parentNode.removeChild(st); if (cur) cur.classList.remove('pbcur');
          window.__exp.push([e[0], 'idle', stat(idle), 'swipe', stat(sw)]);
          setTimeout(next, 700);
        });
        __dbg.swipe(900, 400, 100, 400, 350); setTimeout(function () { __dbg.swipe(100, 400, 900, 400, 350); }, 800);
      });
    }, 500);
  }
  next();
  return 'running';
})();
