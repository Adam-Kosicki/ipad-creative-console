// Page swiping for the iPad 4 (iOS 10). Plain ES5, loaded after main.js by the iPad build.
//
// PhoneBox pages with a native horizontal scroller and CSS scroll snapping. iOS 10 has no scroll-snap-type, so the
// pager slid freely and stopped anywhere; scrolling a 30-page-wide layer was also slow on the A6. Here the pager
// stops scrolling natively: it is moved with a GPU transform, one page per swipe, and pages more than one away are
// hidden so they are not painted. main.js still reads and writes pager.scrollLeft, which this file emulates.
(function () {
  var pager = document.getElementById('pager');
  if (!pager) return;

  var off = 0;            // current offset in px (what main.js sees as scrollLeft)
  var anim = 0;           // running glide (requestAnimationFrame id)
  var shownAround = -1;   // page whose neighbourhood is currently visible
  var W = function () { return window.innerWidth; };
  var count = function () { return pager.children.length; };
  var maxOff = function () { return Math.max(0, (count() - 1) * W()); };

  var initial = pager.scrollLeft; // where main.js already put it with native scrolling
  pager.style.overflow = 'visible';
  pager.scrollLeft = 0;

  // Each page is its own absolutely positioned layer moved with translate3d. (One huge pager layer, 7 pages wide at
  // retina resolution, was far too big for the iPad 4's GPU memory: swiping ran at ~12 fps.)
  function paint(x) {
    var w = W(), kids = pager.children, c = Math.round(x / w);
    for (var i = 0; i < kids.length; i++) {
      if (Math.abs(i - c) > 1) continue;
      var t = 'translate3d(' + Math.round(i * w - x) + 'px,0,0)';
      var st = kids[i].style;
      st.webkitTransform = t; st.transform = t;
    }
  }
  // Only the page in view and its two neighbours are painted.
  function cull(force) {
    var c = Math.round(off / W());
    if (c === shownAround && !force) return;
    shownAround = c;
    var kids = pager.children;
    for (var i = 0; i < kids.length; i++) {
      var v = Math.abs(i - c) <= 1 ? '' : 'hidden';
      if (kids[i].style.visibility !== v) kids[i].style.visibility = v;
      // ipad.css hides the charts (canvases) of every page but the one in view: they are costly to composite
      if (i === c) kids[i].classList.add('pbcur'); else kids[i].classList.remove('pbcur');
    }
    paint(off);
  }
  var scrollEvent = function () {
    var e = document.createEvent('Event');
    e.initEvent('scroll', false, false);
    pager.dispatchEvent(e);
  };
  function set(x, fromUser) {
    if (!fromUser && anim) { cancelAnimationFrame(anim); anim = 0; }
    off = x;
    cull();
    paint(x);
    scrollEvent();
  }
  Object.defineProperty(pager, 'scrollLeft', {
    configurable: true,
    get: function () { return off; },
    set: function (v) { set(Math.max(0, Math.min(maxOff(), +v || 0)), false); },
  });
  pager.scrollTo = function (a, b) {
    var left = a && typeof a === 'object' ? a.left : a;
    if (left === undefined) return;
    if (a && a.behavior === 'smooth') glide(Math.max(0, Math.min(maxOff(), left)), 300);
    else pager.scrollLeft = left;
  };

  function glide(to, ms) {
    if (anim) cancelAnimationFrame(anim);
    var from = off, t0 = Date.now();
    var step = function () {
      var k = Math.min(1, (Date.now() - t0) / ms), e = 1 - Math.pow(1 - k, 3);
      set(from + (to - from) * e, true);
      anim = k < 1 ? requestAnimationFrame(step) : 0;
    };
    anim = requestAnimationFrame(step);
  }

  // ---- the swipe ----
  var NO_SWIPE = 'input, textarea, select, [contenteditable], .s-list, .vb, .radio-carousel-track, .ac-dial, .ps-list';
  var x0 = 0, y0 = 0, start = 0, lock = '', hist = [], tracking = false;
  // Swipe latency recorder (read with __swipeStats() from /__dbg/eval after swiping by hand): touchmove age when the
  // handler runs, time spent in the handler, and the gaps between animation frames while a finger is down.
  var R = { delay: [], hand: [], gaps: [], touching: false, last: 0, until: 0 };
  (function loop(ts) { if (R.touching || ts < R.until) { if (R.last) R.gaps.push(ts - R.last); R.last = ts; } else R.last = 0; requestAnimationFrame(loop); })(0);
  function summ(a) { if (!a.length) return null; var s = a.slice().sort(function (x, y) { return x - y; }), t = 0; a.forEach(function (x) { t += x; }); return { n: a.length, avg: Math.round(t / a.length * 10) / 10, p50: Math.round(s[Math.floor(s.length / 2)] * 10) / 10, p95: Math.round(s[Math.floor(s.length * .95)] * 10) / 10, max: Math.round(s[s.length - 1] * 10) / 10 }; }
  window.__swipeStats = function () { var g = summ(R.gaps.slice(1)); return JSON.stringify({ frameGapMs: g, fps: g ? Math.round(1000 / g.avg * 10) / 10 : null, touchmoveDelayMs: summ(R.delay), handlerMs: summ(R.hand) }); };
  window.__swipeReset = function () { R.delay = []; R.hand = []; R.gaps = []; return 'reset'; };
  pager.addEventListener('touchstart', function () { R.touching = true; }, true);
  pager.addEventListener('touchend', function () { R.touching = false; R.until = performance.now() + 600; }, true);
  pager.addEventListener('touchcancel', function () { R.touching = false; }, true);
  pager.addEventListener('touchstart', function (e) {
    tracking = false;
    if (e.touches.length !== 1 || count() < 2) return;
    var t = e.target;
    if (t && t.closest && t.closest(NO_SWIPE)) return;
    var ov = document.getElementById('overview');
    if (ov && !ov.hidden) return;
    if (anim) { cancelAnimationFrame(anim); anim = 0; }
    x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
    start = off; lock = ''; hist = [[Date.now(), x0]]; tracking = true;
  }, true);
  pager.addEventListener('touchmove', function (e) {
    var h0 = performance.now(), age = Date.now() - e.timeStamp; if (age > -1000 && age < 5000) R.delay.push(age);
    if (!tracking) return;
    var x = e.touches[0].clientX, dx = x - x0, dy = e.touches[0].clientY - y0;
    if (!lock) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      lock = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    }
    if (lock !== 'x') return;
    e.preventDefault();
    var to = start - dx;
    if (to < 0) to = to / 3;                                  // rubber band at the ends
    else if (to > maxOff()) to = maxOff() + (to - maxOff()) / 3;
    hist.push([Date.now(), x]);
    if (hist.length > 6) hist.shift();
    if (shownAround === Math.round(start / W())) {
      // show both neighbours while dragging
      var kids = pager.children, c = Math.round(start / W());
      for (var i = Math.max(0, c - 1); i <= Math.min(kids.length - 1, c + 1); i++) kids[i].style.visibility = '';
    }
    off = to; paint(to); R.hand.push(performance.now() - h0);
  }, { passive: false, capture: true });
  function end() {
    if (!tracking) return;
    tracking = false;
    if (lock !== 'x') return;
    var a = hist[0], b = hist[hist.length - 1];
    var v = b && a && b[0] > a[0] ? (b[1] - a[1]) / (b[0] - a[0]) : 0;   // px/ms, + = finger moving right
    var dx = start - off;
    var page = Math.round(start / W());
    if (dx < -W() * 0.18 || v < -0.35) page += 1;
    else if (dx > W() * 0.18 || v > 0.35) page -= 1;
    page = Math.max(0, Math.min(count() - 1, page));
    glide(page * W(), Math.max(180, Math.min(320, Math.abs(page * W() - off) / 3)));
  }
  pager.addEventListener('touchend', end, true);
  pager.addEventListener('touchcancel', end, true);

  // Rotation or a rebuilt layout: stay on the same page.
  window.addEventListener('resize', function () { setTimeout(function () { cull(true); }, 0); });
  if (window.MutationObserver) new MutationObserver(function () { cull(true); }).observe(pager, { childList: true });
  pager.scrollLeft = initial;
  cull(true);
})();
