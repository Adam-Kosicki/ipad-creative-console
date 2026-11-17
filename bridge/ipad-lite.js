// Lite mode for old tablets (iPad 4 and similar). Plain ES5, loaded before main.js by the iPad build.
//
// Dragging a whole page under the finger is what feels laggy on an old GPU. In lite mode pages do not follow the
// finger: a tab bar at the bottom names every page, a tap (or a flick) switches instantly, nothing is animated, and
// no page is its own GPU layer. ipad-pager.js and ipad-lite.css read the `pb-lite` class set here.
//
//   ?lite=1 turns it on, ?lite=0 off (remembered on this device). Default: on for iOS 10 and older.
(function () {
  var root = document.documentElement;
  var KEY = 'pb-lite';
  var m = /[?&]lite=([01])/.exec(location.search);
  var saved = null;
  try {
    if (m) localStorage.setItem(KEY, m[1]);
    saved = localStorage.getItem(KEY);
  } catch (_) {}
  var ios = /(?:iPad|iPhone|iPod).* OS (\d+)_/.exec(navigator.userAgent);
  var on = saved === '1' || (saved !== '0' && !!ios && +ios[1] <= 10);
  if (m && !saved) on = m[1] === '1'; // storage blocked (private tab): the URL still decides
  window.__pbLite = on;
  if (!on) return;
  root.className += ' pb-lite';

  var pager = document.getElementById('pager');
  if (!pager) return;
  var bar = document.createElement('nav');
  bar.id = 'liteTabs';
  document.body.appendChild(bar);

  var W = function () { return window.innerWidth; };
  function current() { return Math.round(pager.scrollLeft / W()); }

  // Page names come from main.js (data-title on each page section, added by build-panel.mjs).
  function build() {
    var kids = pager.children, html = [];
    bar.style.display = kids.length < 2 ? 'none' : '';
    for (var i = 0; i < kids.length; i++) {
      var name = kids[i].getAttribute('data-title') || String(i + 1);
      html.push('<button type="button" data-i="' + i + '">' + esc(name) + '</button>');
    }
    html.push('<button type="button" class="lt-all" aria-label="All pages">⋯</button>');
    bar.innerHTML = html.join('');
    mark();
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }
  var shown = -1;
  function mark() {
    var c = current(), b = bar.children;
    if (c === shown && b[c] && b[c].className === 'on') return;
    shown = c;
    for (var i = 0; i < b.length; i++) {
      if (b[i].className === 'lt-all') continue;
      b[i].className = i === c ? 'on' : '';
    }
  }

  function press(b) {
    if (b.className === 'lt-all') { var d = document.getElementById('dots'); if (d) d.click(); return; }
    pager.scrollLeft = +b.getAttribute('data-i') * W(); // ipad-pager.js turns this into an instant page switch
  }
  // touchend, not click: no 300 ms wait and no missed taps while the panel is busy rendering
  var tx = 0, ty = 0;
  bar.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, true);
  bar.addEventListener('touchend', function (e) {
    var t = e.changedTouches[0];
    if (Math.abs(t.clientX - tx) > 12 || Math.abs(t.clientY - ty) > 12) return;
    var b = e.target && e.target.closest && e.target.closest('button');
    if (!b) return;
    e.preventDefault();
    press(b);
  }, true);
  // mouse and keyboard (a handled touch above cancels its click)
  bar.addEventListener('click', function (e) {
    var b = e.target && e.target.closest && e.target.closest('button');
    if (b) press(b);
  });

  pager.addEventListener('scroll', mark);
  if (window.MutationObserver) new MutationObserver(build).observe(pager, { childList: true });
  window.addEventListener('resize', function () { setTimeout(mark, 0); });
  build();
})();
