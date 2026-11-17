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

  function paint(x) {
    var t = 'translate3d(' + (-Math.round(x)) + 'px,0,0)';
    pager.style.webkitTransform = t;
    pager.style.transform = t;
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
    }
  }
  var scrollEvent = function () {
    var e = document.createEvent('Event');
    e.initEvent('scroll', false, false);
    pager.dispatchEvent(e);
  };
  function set(x, fromUser) {
    if (!fromUser && anim) { cancelAnimationFrame(anim); anim = 0; }
    off = x;
    paint(x);
    cull();
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
    off = to; paint(to);
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
