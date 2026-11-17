// Frame-time probe for the iPad. Run in /__dbg/eval:  1) `__perfStart()` (paste this file once, then call it),
// 2) do a swipe (__dbg.swipe(900,400,100,400,350)) or a list scroll, 3) `__perfStop()` returns JSON stats.
window.__perfStart = function () {
  var t = [], last = 0, run = true;
  window.__perfT = t; window.__perfRun = function () { run = false; };
  (function loop(ts) { if (!run) return; if (last) t.push(ts - last); last = ts; requestAnimationFrame(loop); })(0);
  return 'started';
};
window.__perfStop = function () {
  window.__perfRun();
  var t = (window.__perfT || []).slice(1).sort(function (a, b) { return a - b; });
  if (!t.length) return JSON.stringify({ frames: 0 });
  var sum = 0; for (var i = 0; i < t.length; i++) sum += t[i];
  var q = function (p) { return Math.round(t[Math.min(t.length - 1, Math.floor(t.length * p))] * 10) / 10; };
  var dropped = t.filter(function (x) { return x > 25; }).length;
  return JSON.stringify({ frames: t.length, avgFps: Math.round(1000 / (sum / t.length) * 10) / 10, p50ms: q(0.5), p95ms: q(0.95), maxMs: q(0.999), over25ms: dropped,
    nodes: document.getElementsByTagName('*').length, canvases: document.getElementsByTagName('canvas').length });
};
'perf probe ready';
