// Polyfills that let PhoneBox's panel run in Safari 10 (iPad 4, iOS 10.3.3). Plain ES5, loaded before everything else.
// scripts/build-panel.mjs copies this into bridge/panel/ and fills in CONTAINERS.
(function () {
  var w = window;
  if (typeof w.globalThis === 'undefined') w.globalThis = w;

  if (!Object.fromEntries) Object.fromEntries = function (it) {
    var o = {};
    Array.from(it, function (kv) { o[kv[0]] = kv[1]; });
    return o;
  };
  if (!Object.hasOwn) Object.hasOwn = function (o, k) { return Object.prototype.hasOwnProperty.call(o, k); };
  if (!Array.prototype.flat) Array.prototype.flat = function (d) {
    d = d === undefined ? 1 : d;
    return d < 1 ? this.slice() : this.reduce(function (a, v) { return a.concat(Array.isArray(v) ? v.flat(d - 1) : v); }, []);
  };
  // Target of the build's rewrite of `delete el.dataset.key` (throws in strict code on Safari 10).
  w.__pbDeleteData = function (el, key) {
    if (el && el.removeAttribute) el.removeAttribute('data-' + String(key).replace(/[A-Z]/g, function (c) { return '-' + c.toLowerCase(); }));
    return true;
  };

  // for...of / spread over DOM collections: Safari 10 only makes NodeList iterable. Give the other array-like
  // collections Array's iterator (seen on the iPad: "for (const sheet of document.styleSheets)" threw).
  if (w.Symbol && Symbol.iterator) {
    ['StyleSheetList', 'CSSRuleList', 'HTMLCollection', 'HTMLAllCollection', 'HTMLFormControlsCollection', 'HTMLOptionsCollection',
      'NamedNodeMap', 'DOMTokenList', 'DOMStringList', 'MediaList', 'FileList', 'TouchList', 'NodeList', 'DataTransferItemList',
      'MimeTypeArray', 'PluginArray', 'SVGLengthList', 'SVGNumberList', 'SVGStringList', 'SVGTransformList', 'SVGPointList']
      .forEach(function (n) {
        var C = w[n];
        if (C && C.prototype && !C.prototype[Symbol.iterator]) {
          try { Object.defineProperty(C.prototype, Symbol.iterator, { value: Array.prototype[Symbol.iterator], configurable: true, writable: true }); } catch (_) {}
        }
      });
  }
  // Intl.DateTimeFormat#formatToParts (Safari 11): the world clocks use it with en-GB numeric fields only, so split
  // the formatted string into its numbers and name them in en-GB order.
  if (w.Intl && Intl.DateTimeFormat && !Intl.DateTimeFormat.prototype.formatToParts) {
    Intl.DateTimeFormat.prototype.formatToParts = function (d) {
      var s = this.format(d), o = this.resolvedOptions(), order = /^en-US/.test(o.locale)
        ? ['month', 'day', 'year', 'hour', 'minute', 'second'] : ['day', 'month', 'year', 'hour', 'minute', 'second'];
      var fields = order.filter(function (k) { return o[k] !== undefined; });
      var nums = s.match(/\d+/g) || [], parts = [];
      for (var i = 0; i < fields.length && i < nums.length; i++) {
        var v = nums[i];
        if (fields[i] === 'hour' && v === '24') v = '00';
        parts.push({ type: fields[i], value: v });
      }
      if (/PM/i.test(s)) parts.push({ type: 'dayPeriod', value: 'PM' }); else if (/AM/i.test(s)) parts.push({ type: 'dayPeriod', value: 'AM' });
      return parts;
    };
  }
  // scrollTo({ left, top }) on elements (Safari 10.1 has only window.scrollTo(x, y))
  if (!Element.prototype.scrollTo) Element.prototype.scrollTo = function (a, b) {
    if (a && typeof a === 'object') { if (a.left !== undefined) this.scrollLeft = a.left; if (a.top !== undefined) this.scrollTop = a.top; }
    else { this.scrollLeft = a; this.scrollTop = b; }
  };
  if (!Element.prototype.toggleAttribute) Element.prototype.toggleAttribute = function (n, f) {
    var on = f === undefined ? !this.hasAttribute(n) : !!f;
    if (on) this.setAttribute(n, ''); else this.removeAttribute(n);
    return on;
  };
  if (!Array.prototype.flatMap) Array.prototype.flatMap = function (f, t) { return this.map(f, t).flat(); };
  if (!String.prototype.trimEnd) String.prototype.trimEnd = function () { return this.replace(/\s+$/, ''); };
  if (!String.prototype.trimStart) String.prototype.trimStart = function () { return this.replace(/^\s+/, ''); };
  if (!w.queueMicrotask) w.queueMicrotask = function (f) { Promise.resolve().then(f); };
  // MediaQueryList.addEventListener (Safari 14)
  if (w.matchMedia) {
    var mql = w.matchMedia('all');
    if (mql && !mql.addEventListener && mql.addListener) {
      var MQ = Object.getPrototypeOf(mql);
      MQ.addEventListener = function (t, f) { this.addListener(f); };
      MQ.removeEventListener = function (t, f) { this.removeListener(f); };
    }
  }
  if (w.Promise && !Promise.prototype['finally']) Promise.prototype['finally'] = function (f) {
    return this.then(function (v) { return Promise.resolve(f()).then(function () { return v; }); },
      function (e) { return Promise.resolve(f()).then(function () { throw e; }); });
  };

  // AbortController: enough for fetch timeouts. Aborting rejects the caller's promise; the request itself runs on.
  if (!w.AbortController) {
    var Signal = function () { this.aborted = false; this._l = []; this.onabort = null; };
    Signal.prototype.addEventListener = function (t, f) { if (t === 'abort') this._l.push(f); };
    Signal.prototype.removeEventListener = function (t, f) { this._l = this._l.filter(function (x) { return x !== f; }); };
    w.AbortController = function () { this.signal = new Signal(); };
    w.AbortController.prototype.abort = function () {
      var s = this.signal; if (s.aborted) return;
      s.aborted = true;
      var ev = { type: 'abort', target: s };
      if (s.onabort) s.onabort(ev);
      s._l.forEach(function (f) { f(ev); });
    };
    w.AbortSignal = Signal;
    var nativeFetch = w.fetch;
    if (nativeFetch) w.fetch = function (input, init) {
      var sig = init && init.signal;
      if (sig) { var copy = {}; for (var k in init) if (k !== 'signal') copy[k] = init[k]; init = copy; }
      var p = nativeFetch.call(w, input, init);
      if (!sig || !(sig instanceof Signal)) return p;
      return new Promise(function (resolve, reject) {
        var fail = function () { var e = new Error('Aborted'); e.name = 'AbortError'; reject(e); };
        if (sig.aborted) return fail();
        sig.addEventListener('abort', fail);
        p.then(resolve, reject);
      });
    };
  }

  // ResizeObserver: polled, good enough for a panel that only changes size on rotation.
  if (!w.ResizeObserver) {
    w.ResizeObserver = function (cb) { this.cb = cb; this.els = []; var self = this; this.t = setInterval(function () { self._check(); }, 500); };
    w.ResizeObserver.prototype.observe = function (el) { this.els.push({ el: el, w: -1, h: -1 }); this._check(); };
    w.ResizeObserver.prototype.unobserve = function (el) { this.els = this.els.filter(function (e) { return e.el !== el; }); };
    w.ResizeObserver.prototype.disconnect = function () { this.els = []; clearInterval(this.t); };
    w.ResizeObserver.prototype._check = function () {
      var changed = [];
      this.els.forEach(function (e) {
        var r = e.el.getBoundingClientRect();
        if (r.width !== e.w || r.height !== e.h) { e.w = r.width; e.h = r.height; changed.push({ target: e.el, contentRect: r }); }
      });
      if (changed.length) this.cb(changed, this);
    };
  }
  // IntersectionObserver: report everything as visible.
  if (!w.IntersectionObserver) {
    w.IntersectionObserver = function (cb) { this.cb = cb; };
    w.IntersectionObserver.prototype.observe = function (el) {
      var cb = this.cb, self = this;
      setTimeout(function () { cb([{ target: el, isIntersecting: true, intersectionRatio: 1 }], self); }, 0);
    };
    w.IntersectionObserver.prototype.unobserve = w.IntersectionObserver.prototype.disconnect = function () {};
  }
  if (!w.TextDecoder) {
    w.TextDecoder = function () {};
    w.TextDecoder.prototype.decode = function (buf) {
      if (!buf) return '';
      var s = '', b = new Uint8Array(buf.buffer || buf);
      for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
      try { return decodeURIComponent(escape(s)); } catch (_) { return s; }
    };
  }

  // Pointer events (Safari 13+): re-fire touches and mouse clicks as pointerdown/move/up/cancel.
  if (!w.PointerEvent) {
    var fire = function (type, src, t) {
      var e = document.createEvent('Event');
      e.initEvent(type, true, true);
      e.pointerId = t ? t.identifier + 1 : 1;
      e.pointerType = t ? 'touch' : 'mouse';
      e.isPrimary = true;
      e.button = 0; e.buttons = type === 'pointerup' ? 0 : 1;
      var p = t || src;
      e.clientX = p.clientX; e.clientY = p.clientY; e.pageX = p.pageX; e.pageY = p.pageY;
      e.screenX = p.screenX; e.screenY = p.screenY;
      var target = (captured[e.pointerId]) || (t ? (type === 'pointerdown' ? src.target : document.elementFromPoint(p.clientX, p.clientY) || src.target) : src.target);
      if (!target.dispatchEvent(e)) src.preventDefault();
      if (type === 'pointerup' || type === 'pointercancel') delete captured[e.pointerId];
    };
    var captured = {};
    Element.prototype.setPointerCapture = function (id) { captured[id] = this; };
    Element.prototype.releasePointerCapture = function (id) { if (captured[id] === this) delete captured[id]; };
    Element.prototype.hasPointerCapture = function (id) { return captured[id] === this; };
    var each = function (type) { return function (ev) { for (var i = 0; i < ev.changedTouches.length; i++) fire(type, ev, ev.changedTouches[i]); }; };
    document.addEventListener('touchstart', each('pointerdown'), true);
    document.addEventListener('touchmove', each('pointermove'), true);
    document.addEventListener('touchend', each('pointerup'), true);
    document.addEventListener('touchcancel', each('pointercancel'), true);
    var lastTouch = 0;
    document.addEventListener('touchend', function () { lastTouch = Date.now(); }, true);
    ['mousedown:pointerdown', 'mousemove:pointermove', 'mouseup:pointerup'].forEach(function (pair) {
      var p = pair.split(':');
      document.addEventListener(p[0], function (ev) { if (Date.now() - lastTouch > 800) fire(p[1], ev, null); }, true);
    });
    // el.onpointerdown = fn: Safari 10 has no such handler property, so make one that registers a listener.
    ['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (type) {
      var prop = 'on' + type, slot = '__pb_' + prop;
      if (prop in HTMLElement.prototype) return;
      Object.defineProperty(HTMLElement.prototype, prop, {
        configurable: true,
        get: function () { return this[slot] || null; },
        set: function (fn) {
          if (this[slot]) this.removeEventListener(type, this[slot]);
          this[slot] = typeof fn === 'function' ? fn : null;
          if (this[slot]) this.addEventListener(type, this[slot]);
        },
      });
    });
    w.PointerEvent = function () {};
  }

  // Container query units: the build turns 5cqw into calc(5 * var(--cqw)); here every container gets its own
  // --cqw/--cqh/--cqmin/--cqmax in px, re-measured when the page changes.
  var CONTAINERS = [".radio-carousel",".w",".wc"];
  // clamp()/min()/max() with plain lengths: [fn, [[number, unit], ...]], set as --pbm<index> in px
  var MATH = [["clamp",[[15,"px"],[2.5,"vw"],[24,"px"]]],["clamp",[[84,"px"],[78,"cqh"],[142,"px"]]],["clamp",[[6,"px"],[5,"cqh"],[12,"px"]]],["clamp",[[4,"px"],[4,"cqh"],[9,"px"]]],["clamp",[[42,"px"],[54,"cqh"],[88,"px"]]],["clamp",[[10,"px"],[10,"cqh"],[16,"px"]]],["clamp",[[9.5,"px"],[7.5,"cqh"],[12,"px"]]],["clamp",[[14,"px"],[2.2,"vw"],[20,"px"]]],["clamp",[[10,"px"],[7,"cqmin"],[20,"px"]]],["min",[[760,"px"],[94,"vw"]]],["clamp",[[10,"px"],[5,"cqh"],[12.5,"px"]]],["clamp",[[11,"px"],[7.5,"cqh"],[19,"px"]]],["clamp",[[2,"px"],[4,"cqh"],[14,"px"]]],["clamp",[[18,"px"],[13,"cqh"],[34,"px"]]],["clamp",[[10,"px"],[5.4,"cqh"],[13,"px"]]],["clamp",[[8,"px"],[6,"cqmin"],[18,"px"]]],["min",[[40,"cqh"],[18,"cqw"]]],["clamp",[[10,"px"],[13,"cqh"],[15,"px"]]],["clamp",[[10,"px"],[8,"cqh"],[14,"px"]]],["clamp",[[8,"px"],[4,"cqh"],[16,"px"]]],["clamp",[[10,"px"],[3,"cqw"],[18,"px"]]],["clamp",[[8,"px"],[3,"cqw"],[18,"px"]]],["min",[[58,"cqh"],[34,"cqw"]]],["clamp",[[8,"px"],[6,"cqh"],[18,"px"]]],["clamp",[[9,"px"],[4.5,"cqh"],[13,"px"]]],["clamp",[[13,"px"],[9,"cqh"],[30,"px"]]],["clamp",[[11,"px"],[6,"cqh"],[19,"px"]]],["clamp",[[5,"px"],[9,"cqh"],[10,"px"]]],["clamp",[[8,"px"],[6,"cqw"],[12,"px"]]],["clamp",[[9,"px"],[12,"cqh"],[11,"px"]]],["clamp",[[16,"px"],[30,"cqh"],[40,"px"]]],["clamp",[[10,"px"],[14,"cqh"],[15,"px"]]],["clamp",[[9.5,"px"],[13,"cqh"],[13,"px"]]],["min",[[66,"cqh"],[88,"cqw"]]],["min",[[15,"cqh"],[22,"cqw"]]],["clamp",[[9,"px"],[6,"cqh"],[13,"px"]]],["clamp",[[9,"px"],[5.4,"cqh"],[12,"px"]]],["clamp",[[18,"px"],[15,"cqh"],[34,"px"]]],["clamp",[[13,"px"],[10,"cqh"],[20,"px"]]],["min",[[50,"cqh"],[170,"px"]]],["min",[[10,"cqh"],[28,"px"]]],["clamp",[[18,"px"],[8,"cqh"],[26,"px"]]],["min",[[58,"cqh"],[124,"px"]]],["clamp",[[16,"px"],[7,"cqmin"],[30,"px"]]],["clamp",[[10,"px"],[3.6,"cqmin"],[14,"px"]]],["min",[[40,"cqh"],[30,"cqw"]]],["clamp",[[10,"px"],[15,"cqh"],[18,"px"]]],["clamp",[[9.5,"px"],[10,"cqh"],[13,"px"]]],["min",[[36,"cqh"],[36,"cqw"]]],["min",[[36,"cqh"],[28,"cqw"]]],["clamp",[[9,"px"],[9,"cqh"],[12,"px"]]],["clamp",[[14,"px"],[9,"cqh"],[30,"px"]]],["clamp",[[10,"px"],[6,"cqh"],[15,"px"]]],["min",[[52,"cqh"],[80,"cqw"]]],["clamp",[[30,"px"],[14,"cqh"],[46,"px"]]],["clamp",[[13,"px"],[6,"cqh"],[19,"px"]]],["clamp",[[10,"px"],[11,"cqh"],[14,"px"]]],["min",[[38,"cqh"],[17,"cqw"]]],["clamp",[[8,"px"],[7,"cqmin"],[16,"px"]]],["min",[[55,"cqh"],[12,"cqw"]]],["min",[[42,"cqh"],[14,"cqw"]]],["min",[[42,"cqh"],[20,"cqw"]]],["clamp",[[10,"px"],[10,"cqh"],[14,"px"]]],["min",[[70,"cqh"],[80,"cqw"]]],["min",[[100,"cqh"],[100,"cqw"]]],["min",[[88,"cqh"],[100,"cqw"]]],["clamp",[[10,"px"],[6,"cqh"],[14,"px"]]],["min",[[30,"cqh"],[15,"cqw"]]],["min",[[38,"cqh"],[60,"cqw"]]],["min",[[48,"cqh"],[30,"cqw"]]],["min",[[84,"cqh"],[84,"cqw"]]],["clamp",[[13,"px"],[9,"cqh"],[26,"px"]]],["clamp",[[18,"px"],[16,"cqh"],[52,"px"]]],["clamp",[[10,"px"],[6,"cqmin"],[20,"px"]]],["min",[[60,"cqh"],[30,"cqw"]]],["clamp",[[10,"px"],[7,"cqh"],[14,"px"]]],["clamp",[[40,"px"],[14,"vmin"],[72,"px"]]],["clamp",[[17,"px"],[6,"vmin"],[32,"px"]]],["clamp",[[11,"px"],[16,"cqh"],[15,"px"]]],["clamp",[[14,"px"],[26,"cqh"],[26,"px"]]],["clamp",[[2,"px"],[6,"cqh"],[12,"px"]]],["min",[[26,"cqh"],[13,"cqw"]]],["max",[[2,"px"],[1.6,"cqh"]]],["clamp",[[10,"px"],[9,"cqh"],[14,"px"]]],["clamp",[[12,"px"],[9,"cqh"],[22,"px"]]],["min",[[46,"px"],[40,"cqw"]]],["clamp",[[10,"px"],[7,"cqh"],[13,"px"]]],["min",[[40,"cqh"],[22,"cqw"]]],["clamp",[[11,"px"],[8,"cqh"],[15,"px"]]],["clamp",[[11,"px"],[7,"cqh"],[15,"px"]]],["clamp",[[11,"px"],[11,"cqmin"],[38,"px"]]],["clamp",[[16,"px"],[9,"cqmin"],[34,"px"]]],["clamp",[[15,"px"],[14,"cqh"],[22,"px"]]],["clamp",[[12,"px"],[6,"cqmin"],[22,"px"]]],["clamp",[[22,"px"],[15,"cqmin"],[76,"px"]]],["clamp",[[11,"px"],[5,"cqmin"],[18,"px"]]],["min",[[34,"cqh"],[86,"px"]]],["min",[[10,"cqh"],[22,"px"]]]];
  var sel = CONTAINERS.join(',');
  var px = function (a, cw, ch) {
    var n = a[0], vw = w.innerWidth / 100, vh = w.innerHeight / 100;
    switch (a[1]) {
      case 'px': return n;
      case 'cqw': case 'cqi': return n * cw;
      case 'cqh': case 'cqb': return n * ch;
      case 'cqmin': return n * Math.min(cw, ch);
      case 'cqmax': return n * Math.max(cw, ch);
      case 'vw': return n * vw;
      case 'vh': return n * vh;
      case 'vmin': return n * Math.min(vw, vh);
      case 'vmax': return n * Math.max(vw, vh);
    }
    return n;
  };
  var setSize = function (el, wd, ht) {
    var cw = wd / 100, ch = ht / 100;
    el.style.setProperty('--cqw', cw + 'px');
    el.style.setProperty('--cqh', ch + 'px');
    el.style.setProperty('--cqmin', Math.min(cw, ch) + 'px');
    el.style.setProperty('--cqmax', Math.max(cw, ch) + 'px');
    for (var k = 0; k < MATH.length; k++) {
      var f = MATH[k][0], v = MATH[k][1].map(function (a) { return px(a, cw, ch); });
      var r = f === 'clamp' ? Math.max(v[0], Math.min(v[1], v[2])) : f === 'min' ? Math.min.apply(Math, v) : Math.max.apply(Math, v);
      el.style.setProperty('--pbm' + k, Math.round(r * 100) / 100 + 'px');
    }
  };
  var measure = function () {
    // outside any container, cq units fall back to the viewport
    var root = document.documentElement;
    if (root.__cqw !== w.innerWidth || root.__cqh !== w.innerHeight) {
      root.__cqw = w.innerWidth; root.__cqh = w.innerHeight;
      setSize(root, w.innerWidth, w.innerHeight);
    }
    if (!sel) return;
    var els = document.querySelectorAll(sel);
    for (var i = 0; i < els.length; i++) {
      var el = els[i], wd = el.clientWidth, ht = el.clientHeight;
      if (el.__cqw === wd && el.__cqh === ht) continue;
      el.__cqw = wd; el.__cqh = ht;
      setSize(el, wd, ht);
    }
  };
  var queued = false;
  var queue = function () { if (queued) return; queued = true; requestAnimationFrame(function () { queued = false; measure(); }); };
  w.addEventListener('resize', queue);
  w.addEventListener('orientationchange', function () { setTimeout(measure, 300); });
  document.addEventListener('DOMContentLoaded', function () {
    measure();
    if (w.MutationObserver) new MutationObserver(queue).observe(document.body, { childList: true, subtree: true });
    setInterval(measure, 2000);
  });
})();
