// Remote debugging for the iPad panel (ES5, Safari 10). Injected first into every page by bridge/debug-proxy.js.
// Sends console output and errors to the PC, and runs commands sent from the PC (eval, reload, page snapshot, taps).
(function () {
  if (window.__dbg) return;
  var id = 'ipad-' + Math.random().toString(36).slice(2, 8);
  var queue = [], flushing = false, seq = 0;

  function str(v, depth) {
    depth = depth || 0;
    try {
      if (v === undefined) return 'undefined';
      if (v === null) return 'null';
      if (v instanceof Error) return (v.name || 'Error') + ': ' + v.message + (v.stack ? '\n' + v.stack : '');
      if (typeof v === 'function') return 'function ' + (v.name || '') + '()';
      if (typeof v !== 'object') return String(v);
      if (v.nodeType === 1) return '<' + v.tagName.toLowerCase() + (v.id ? '#' + v.id : '') + (v.className && typeof v.className === 'string' ? '.' + v.className.split(' ').join('.') : '') + '>';
      if (depth > 2) return Object.prototype.toString.call(v);
      return JSON.stringify(v, null, 0).slice(0, 4000);
    } catch (e) { return Object.prototype.toString.call(v); }
  }
  function send(kind, text, extra) {
    var e = { client: id, seq: ++seq, t: Date.now(), kind: kind, text: String(text).slice(0, 20000), url: location.pathname };
    for (var k in extra || {}) e[k] = extra[k];
    queue.push(e);
    if (queue.length > 500) queue.splice(0, queue.length - 500);
    setTimeout(flush, 50);
  }
  function post(path, body, cb) {
    var x = new XMLHttpRequest();
    x.open('POST', path, true);
    x.setRequestHeader('Content-Type', 'application/json');
    x.onreadystatechange = function () { if (x.readyState === 4 && cb) cb(x.status); };
    x.send(JSON.stringify(body));
  }
  function flush() {
    if (flushing || !queue.length) return;
    flushing = true;
    var batch = queue.splice(0, queue.length);
    post('/__dbg/log', batch, function (status) {
      flushing = false;
      if (status !== 200) { queue = batch.concat(queue); setTimeout(flush, 3000); } else if (queue.length) flush();
    });
  }

  ['log', 'info', 'warn', 'error', 'debug'].forEach(function (m) {
    var orig = console[m] ? console[m].bind(console) : function () {};
    console[m] = function () {
      var parts = [];
      for (var i = 0; i < arguments.length; i++) parts.push(str(arguments[i]));
      send(m, parts.join(' '));
      orig.apply(null, arguments);
    };
  });
  window.addEventListener('error', function (ev) {
    if (ev.target && ev.target !== window && ev.target.tagName) {
      return send('error', 'failed to load <' + ev.target.tagName.toLowerCase() + '> ' + (ev.target.src || ev.target.href || ''));
    }
    send('error', (ev.message || 'error') + (ev.error && ev.error.stack ? '\n' + ev.error.stack : ''),
      { src: ev.filename, line: ev.lineno, col: ev.colno });
  }, true);
  window.addEventListener('unhandledrejection', function (ev) { send('error', 'unhandled promise rejection: ' + str(ev.reason)); });

  // Taps without a finger: mouse events at the element's center (ipad-compat turns these into pointer events), then click.
  function at(target) {
    if (typeof target === 'string') { var el = document.querySelector(target); if (!el) throw new Error('no element matches ' + target); return el; }
    return target;
  }
  function center(el) { var r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }
  function mouse(type, x, y, el) {
    var e = document.createEvent('MouseEvents');
    e.initMouseEvent(type, true, true, window, 1, x, y, x, y, false, false, false, false, 0, null);
    (el || document.elementFromPoint(x, y) || document.body).dispatchEvent(e);
  }
  // iOS Safari: real TouchEvents from document.createTouch; elsewhere fall back to mouse events.
  function touch(type, x, y, el) {
    el = el || document.elementFromPoint(x, y) || document.body;
    if (!document.createTouch) return mouse({ touchstart: 'mousedown', touchmove: 'mousemove', touchend: 'mouseup' }[type], x, y, el);
    var t = document.createTouch(window, el, 1, x + window.pageXOffset, y + window.pageYOffset, x, y);
    var list = type === 'touchend' ? document.createTouchList() : document.createTouchList(t);
    var e = document.createEvent('TouchEvent');
    e.initTouchEvent(type, true, true, window, 0, x, y, x, y, false, false, false, false, list, list, document.createTouchList(t), 1, 0);
    el.dispatchEvent(e);
  }
  var api = {
    id: id,
    tap: function (target, y) {
      var p, el;
      if (typeof target === 'number') { p = { x: target, y: y }; el = document.elementFromPoint(p.x, p.y); }
      else { el = at(target); p = center(el); }
      touch('touchstart', p.x, p.y, el); touch('touchend', p.x, p.y, el);
      mouse('mousedown', p.x, p.y, el); mouse('mouseup', p.x, p.y, el); mouse('click', p.x, p.y, el);
      return str(el);
    },
    // A finger swipe over `ms` milliseconds (default 250), so momentum code sees real speeds. Resolves when done.
    swipe: function (x1, y1, x2, y2, ms, steps) {
      ms = ms || 250; steps = steps || 12;
      var el = document.elementFromPoint(x1, y1), i = 0;
      touch('touchstart', x1, y1, el);
      return new Promise(function (resolve) {
        (function step() {
          i++;
          var x = x1 + (x2 - x1) * i / steps, y = y1 + (y2 - y1) * i / steps;
          touch('touchmove', x, y, el);
          if (i < steps) return setTimeout(step, ms / steps);
          touch('touchend', x2, y2, el);
          resolve(str(el));
        })();
      });
    },
    // What is on screen, as text: visible elements with their boxes. Cheap enough to send each time.
    outline: function (root, max) {
      var out = [], vw = window.innerWidth, vh = window.innerHeight;
      function walk(el, d) {
        if (out.length >= (max || 300)) return;
        var r = el.getBoundingClientRect(), cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden' || r.width === 0 || r.height === 0) return;
        if (r.bottom < 0 || r.right < 0 || r.top > vh || r.left > vw) return;
        var own = '';
        for (var c = el.firstChild; c; c = c.nextSibling) if (c.nodeType === 3) own += c.nodeValue;
        own = own.replace(/\s+/g, ' ').trim().slice(0, 60);
        out.push(new Array(d + 1).join('  ') + str(el) + ' [' + Math.round(r.left) + ',' + Math.round(r.top) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height) + ']' + (own ? ' "' + own + '"' : ''));
        for (var k = el.firstElementChild; k; k = k.nextElementSibling) walk(k, d + 1);
      }
      walk(at(root || 'body'), 0);
      return out.join('\n');
    }
  };
  window.__dbg = api;

  function run(cmd) {
    var reply = function (ok, value) { post('/__dbg/result', { client: id, cmd: cmd.id, ok: ok, value: str(value) }); };
    try {
      if (cmd.type === 'reload') { reply(true, 'reloading'); setTimeout(function () { location.reload(true); }, 100); return; }
      if (cmd.type === 'snapshot') {
        return reply(true, JSON.stringify({ url: location.href, w: window.innerWidth, h: window.innerHeight, scrollX: window.pageXOffset,
          scrollY: window.pageYOffset, dpr: window.devicePixelRatio, html: document.documentElement.outerHTML }));
      }
      var v = (0, eval)(cmd.code);
      if (v && typeof v.then === 'function') v.then(function (r) { reply(true, r); }, function (e) { reply(false, e); });
      else reply(true, v);
    } catch (e) { reply(false, e); }
  }
  var fails = 0;
  function poll() {
    var x = new XMLHttpRequest();
    x.open('GET', '/__dbg/poll?client=' + id + '&ua=' + encodeURIComponent(navigator.userAgent) + '&_=' + Date.now(), true);
    x.onreadystatechange = function () {
      if (x.readyState !== 4) return;
      if (x.status === 200) {
        fails = 0;
        var cmds = [];
        try { cmds = JSON.parse(x.responseText); } catch (e) {}
        for (var i = 0; i < cmds.length; i++) run(cmds[i]);
        setTimeout(poll, 0);
      } else setTimeout(poll, Math.min(30000, 1000 * Math.pow(2, fails++)));
    };
    x.send();
  }
  send('info', 'debug client loaded: ' + navigator.userAgent + ' ' + window.innerWidth + 'x' + window.innerHeight);
  setTimeout(poll, 500);
})();
