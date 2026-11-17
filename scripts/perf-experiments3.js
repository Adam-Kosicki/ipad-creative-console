// Round 3 (run on the page in view; set pager.scrollLeft first) perf experiments (paste into /__dbg/eval on Home; poll JSON.stringify(window.__exp) until 'done').
(function () {
  var NB = '#pager>.page:not(.pbcur)';
  var EXPS = [
    ['base', ''],
    ['nb-svg-hidden', NB + ' svg{visibility:hidden!important}'],
    ['nb-no-bg', NB + ' *{background-image:none!important;background-color:transparent!important}'],
    ['nb-no-border-radius', NB + ' *{border-radius:0!important}'],
    ['nb-all-content-hidden', NB + ' .w{visibility:hidden!important}'],
    ['nb-svg+bg', NB + ' svg{visibility:hidden!important}' + NB + ' *{background-image:none!important}'],
    ['cur-no-bg', '#pager>.pbcur *{background-image:none!important}'],
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
