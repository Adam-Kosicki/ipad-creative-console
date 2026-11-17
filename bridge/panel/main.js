(() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __async = (__this, __arguments, generator) => {
    return new Promise((resolve, reject) => {
      var fulfilled = (value) => {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      };
      var rejected = (value) => {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      };
      var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
      step((generator = generator.apply(__this, __arguments)).next());
    });
  };

  // ../../../tmp/claude-0/-home-claude/d7433526-111a-5017-bcc4-3fd104415c33/scratchpad/pb/src/android/app/src/main/assets/www/registry.js
  var W = {};

  // ../../../tmp/claude-0/-home-claude/d7433526-111a-5017-bcc4-3fd104415c33/scratchpad/pb/src/android/app/src/main/assets/www/appearance.js
  (() => {
    "use strict";
    const presets = Object.freeze({
      default: {},
      cards: { radius: 18, gap: 12, padding: 12, border: true, shadow: false },
      flat: { radius: 12, gap: 12, padding: 12, border: false, shadow: false },
      borderless: { radius: 0, gap: 12, padding: 12, border: false, shadow: false },
      seamless: { radius: 0, gap: 0, padding: 12, border: true, shadow: false }
    });
    const fonts = Object.freeze({
      default: "",
      sans: 'Roboto, "Segoe UI", system-ui, sans-serif',
      rounded: '"SF Pro Rounded", "Hiragino Maru Gothic ProN", Quicksand, Nunito, "Trebuchet MS", Roboto, system-ui, sans-serif',
      condensed: '"Roboto Condensed", "Arial Narrow", "Liberation Sans Narrow", sans-serif',
      serif: 'Georgia, "Times New Roman", "Noto Serif", serif',
      mono: '"Roboto Mono", "Cascadia Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
    });
    const limits = { radius: 32, gap: 24, padding: 24, pagePadding: 32 };
    const scaledSheets = /* @__PURE__ */ new WeakSet();
    const skipScale = /^(inherit|initial|unset|revert|revert-layer|xx-small|x-small|small|medium|large|x-large|xx-large|smaller|larger|-?\d*\.?\d+(em|%))$/i;
    function scaleRuleList(rules) {
      if (!rules) return;
      for (const rule of rules) {
        if (rule.cssRules) scaleRuleList(rule.cssRules);
        const size = rule.style && rule.style.fontSize;
        if (!size || size.includes("--widget-font-scale") || skipScale.test(size.trim())) continue;
        if (rule.selectorText && /^(?:html|body|:root)(?:[\s,{[]|$)/i.test(rule.selectorText.trim())) continue;
        const priority = rule.style.getPropertyPriority("font-size");
        rule.style.setProperty("font-size", "calc((" + size + ") * var(--widget-font-scale, 1))", priority);
      }
    }
    function scalePanelSheets() {
      if (typeof document === "undefined" || !document.styleSheets) return;
      for (const sheet2 of document.styleSheets) {
        if (scaledSheets.has(sheet2)) continue;
        const href = sheet2.href || "";
        if (!/\/(?:style|controls)\.css(?:[?#]|$)/i.test(href)) continue;
        try {
          scaleRuleList(sheet2.cssRules);
          scaledSheets.add(sheet2);
        } catch (_) {
        }
      }
    }
    if (typeof window !== "undefined" && window.addEventListener) {
      scalePanelSheets();
      window.addEventListener("load", scalePanelSheets, { once: true });
    }
    function resolve(...layers) {
      let result = {};
      for (const layer of layers) {
        if (!layer || typeof layer !== "object") continue;
        if (typeof layer.style === "string" && Object.prototype.hasOwnProperty.call(presets, layer.style)) {
          result = layer.style === "default" ? { style: "default" } : __spreadProps(__spreadValues(__spreadValues({}, result), presets[layer.style]), { style: layer.style });
        }
        if (typeof layer.font === "string" && Object.prototype.hasOwnProperty.call(fonts, layer.font)) {
          result.font = layer.font;
        }
        if (typeof layer.fontScale === "number" && Number.isFinite(layer.fontScale)) {
          result.fontScale = Math.max(50, Math.min(200, Math.round(layer.fontScale)));
        }
        for (const [key, max] of Object.entries(limits))
          if (typeof layer[key] === "number" && Number.isFinite(layer[key])) result[key] = Math.max(0, Math.min(max, Math.round(layer[key])));
        for (const key of ["border", "shadow"]) if (typeof layer[key] === "boolean") result[key] = layer[key];
      }
      return result;
    }
    function widget(element, appearance = {}) {
      scalePanelSheets();
      const fontStack = appearance.font ? fonts[appearance.font] : "";
      element.classList.toggle("has-widget-font", Boolean(fontStack));
      if (fontStack) element.style.setProperty("--widget-font", fontStack);
      else element.style.removeProperty("--widget-font");
      const scaled = appearance.fontScale != null && appearance.fontScale !== 100;
      element.classList.toggle("has-widget-font-scale", scaled);
      if (scaled) element.style.setProperty("--widget-font-scale", String(appearance.fontScale / 100));
      else element.style.removeProperty("--widget-font-scale");
      for (const key of ["radius", "padding"]) {
        const active = appearance[key] != null;
        element.classList.toggle("has-widget-" + key, active);
        if (active) element.style.setProperty("--widget-" + key, appearance[key] + "px");
        else element.style.removeProperty("--widget-" + key);
      }
      for (const key of ["border", "shadow"]) {
        if (appearance[key] != null) element.dataset["widget" + key[0].toUpperCase() + key.slice(1)] = String(appearance[key]);
        else __pbDeleteData(element, "widget" + key[0].toUpperCase() + key.slice(1));
      }
      if (appearance.style && appearance.style !== "default") element.dataset.widgetSurface = appearance.style;
      else __pbDeleteData(element, "widgetSurface");
    }
    function page(element, grid, appearance = {}) {
      grid.style.gap = appearance.gap != null ? appearance.gap + "px" : "";
      if (appearance.pagePadding != null) {
        const n = appearance.pagePadding + "px";
        element.style.padding = "max(" + n + ", env(safe-area-inset-top)) max(" + n + ", env(safe-area-inset-right)) max(" + n + ", 17px, env(safe-area-inset-bottom)) max(" + n + ", env(safe-area-inset-left))";
      } else element.style.padding = "";
    }
    globalThis.PhoneBoxAppearance = Object.freeze({ presets, fonts, resolve, widget, page });
  })();

  // ../../../tmp/claude-0/-home-claude/d7433526-111a-5017-bcc4-3fd104415c33/scratchpad/pb/src/android/app/src/main/assets/www/widgets/helpers.js
  var inflight = {};
  function cached(key, url, maxAgeMs) {
    const c = store.get("nc:" + key, null);
    if (c && Date.now() - c.at < maxAgeMs) return Promise.resolve(c.data);
    if (inflight[key]) return inflight[key];
    const ctl = new AbortController();
    setTimeout(() => ctl.abort(), 1e4);
    inflight[key] = safeFetch(url, { signal: ctl.signal }).then((r) => {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    }).then((data) => {
      store.set("nc:" + key, { at: Date.now(), data });
      return data;
    }).catch((e) => {
      if (c) return c.data;
      throw e;
    }).finally(() => delete inflight[key]);
    return inflight[key];
  }
  function every(intervalMs, load, retryMs = 6e4) {
    let next = 0;
    return () => {
      if (Date.now() < next) return;
      next = Date.now() + intervalMs;
      Promise.resolve(load()).then((ok) => {
        if (ok === false) next = Math.min(next, Date.now() + retryMs);
      }, () => {
      });
    };
  }
  function sparkLine(canvas, data, col) {
    if (!canvas.clientWidth || !data || data.length < 2) return;
    const [g, w, hh, dpr] = sizeCanvas(canvas);
    g.clearRect(0, 0, w, hh);
    const min = Math.min(...data), max = Math.max(...data), span = max - min || 1;
    g.beginPath();
    data.forEach((v, i) => {
      const x = i / (data.length - 1) * w, y = hh - 2 * dpr - (v - min) / span * (hh - 4 * dpr);
      i ? g.lineTo(x, y) : g.moveTo(x, y);
    });
    g.strokeStyle = col;
    g.lineWidth = 1.5 * dpr;
    g.lineJoin = "round";
    g.stroke();
  }
  var fmtNum = (v) => v == null ? "\u2014" : v >= 1e3 ? v.toLocaleString(LOCALE, { maximumFractionDigits: 0 }) : v >= 10 ? v.toFixed(2) : v.toPrecision(4);
  var pctSpan = (p) => {
    const e = h("span", "chg " + (p >= 0 ? "up" : "down"), `${p >= 0 ? "\u25B2" : "\u25BC"} ${Math.abs(p).toFixed(2)}%`);
    return e;
  };
  var lines = (v, d) => (Array.isArray(v) ? v : typeof v === "string" ? v.split("\n") : d).map((x) => String(x).trim()).filter(Boolean);
  function dialEl() {
    const dial = h("div", "g-dial"), val = h("div", "g-val");
    dial.append(val);
    let svg = null;
    dial.set = (pct, text, unit, elapsed) => {
      if (svg) svg.remove();
      dial.insertAdjacentHTML("afterbegin", ringSvg(pct, elapsed));
      svg = dial.firstElementChild;
      val.replaceChildren(String(text), unit ? h("small", null, unit) : "");
    };
    return dial;
  }
  function canKillAnywhere() {
    return (cfg.pages || []).some((p) => p.enabled !== false && (p.widgets || []).some((w) => {
      var _a;
      return w.type === "processes" && ((_a = w.options) == null ? void 0 : _a.allowKill) !== false;
    }));
  }

  // ../../../tmp/claude-0/-home-claude/d7433526-111a-5017-bcc4-3fd104415c33/scratchpad/pb/src/android/app/src/main/assets/www/widgets/controls.js
  var cached2 = null;
  var at = 0;
  var epoch = 0;
  var pending = null;
  function invalidateDeckState() {
    epoch++;
    cached2 = null;
    at = 0;
    pending = null;
  }
  function deckState(force = false) {
    return __async(this, null, function* () {
      if (!force && cached2 && performance.now() - at < 650) return cached2;
      if (!force && pending) return pending;
      const stamp = epoch;
      const task = api("/controls/state", "GET", 15e3).then((data) => {
        if (stamp === epoch) {
          cached2 = data;
          at = performance.now();
        }
        return data;
      }).finally(() => {
        if (pending === task) pending = null;
      });
      pending = task;
      return task;
    });
  }
  function deckCommand(_0) {
    return __async(this, arguments, function* (kind, values = {}) {
      const query = new URLSearchParams();
      for (const [key, value] of Object.entries(values)) if (value != null) query.set(key, String(value));
      invalidateDeckState();
      const result = yield api(`/controls/command/${encodeURIComponent(kind)}?${query}`, "POST", 2e4);
      if (!result.ok) throw new Error(result.error || "Control is unavailable");
      invalidateDeckState();
      if (kind === "action" || kind === "sound-stop" || kind === "media") {
        api("/state" + (evSeq != null ? "?ev=" + evSeq : "")).then((s) => {
          var _a;
          if (s && (evSeq == null || s.evSeq == null || s.evSeq >= evSeq) && (!((_a = D.state) == null ? void 0 : _a.ts) || !s.ts || s.ts >= D.state.ts)) applyState(s);
        }).catch(() => {
        });
      }
      return result;
    });
  }
  var fail = (error) => toast((error == null ? void 0 : error.message) || "The computer did not answer", "err");
  var button = (label, click, name = label) => {
    const b = h("button", "deck-button", label);
    b.type = "button";
    b.setAttribute("aria-label", name);
    b.onclick = () => __async(void 0, null, function* () {
      haptic();
      b.disabled = true;
      try {
        yield click();
      } catch (e) {
        fail(e);
      } finally {
        b.disabled = false;
      }
    });
    return b;
  };
  var selectedPlayer = (data, options) => {
    var _a, _b;
    const chosen = options.player || store.get("control-player", "");
    return ((_a = data.media) == null ? void 0 : _a.find((p) => p.id === chosen)) || (!options.player ? (_b = data.media) == null ? void 0 : _b[0] : null);
  };
  function reconcile(root, nodes) {
    nodes.forEach((node, index) => {
      if (root.children[index] !== node) root.insertBefore(node, root.children[index] || null);
    });
    [...root.children].filter((node) => !nodes.includes(node)).forEach((node) => node.remove());
  }
  function empty(root, text) {
    root.replaceChildren(h("div", "deck-empty", text));
  }
  function slider(label, send, max = 100) {
    const input = h("input", "deck-slider");
    input.type = "range";
    input.min = 0;
    input.max = max;
    input.step = 1;
    input.setAttribute("aria-label", label);
    const number = h("output", "deck-value");
    let editing = false;
    const fill = () => {
      const lo = +input.min || 0, hi = +input.max || 100;
      input.style.setProperty("--p", (hi > lo ? Math.max(0, Math.min(100, (input.value - lo) / (hi - lo) * 100)) : 0) + "%");
    };
    input.onpointerdown = () => {
      editing = true;
    };
    input.oninput = () => {
      number.textContent = input.value;
      fill();
    };
    input.onchange = () => __async(this, null, function* () {
      editing = false;
      try {
        yield send(+input.value);
      } catch (e) {
        fail(e);
      }
    });
    input.onpointerup = input.onpointercancel = input.onlostpointercapture = input.onblur = () => {
      editing = false;
    };
    return { input, number, set(value) {
      if (!editing && document.activeElement !== input) input.value = String(value);
      number.textContent = String(editing ? input.value : value);
      fill();
    } };
  }
  function meter(value) {
    const e = h("div", "deck-meter", h("i"));
    e.firstChild.style.transform = `scaleX(${Math.max(0, Math.min(1, value || 0))})`;
    return e;
  }
  function audioView(box, options, mode) {
    const root = h("div", `deck-list ${options.layout === "vertical" ? "deck-vertical" : ""}`);
    box.append(root);
    const rows = /* @__PURE__ */ new Map();
    return (data) => {
      var _a, _b;
      if (!((_a = data.audio) == null ? void 0 : _a.available)) {
        empty(root, ((_b = data.audio) == null ? void 0 : _b.error) || "Audio is unavailable on this computer");
        return;
      }
      let items = mode === "apps" || mode === "app" ? data.audio.sessions || [] : data.audio.devices || [];
      if (mode === "mic") items = items.filter((d) => d.direction === "input");
      if (mode === "output") items = items.filter((d) => d.direction === "output");
      if (options.device) items = items.filter((d) => d.id === options.device);
      if (options.application) items = items.filter((d) => d.name.toLowerCase().includes(options.application.toLowerCase()));
      if (mode === "mic" && !options.device) items = items.filter((d) => d.default);
      if (mode === "balance") items = items.filter((d) => d.direction === "output" && d.channels >= 2 && (options.device || d.default));
      if (!items.length) {
        empty(root, mode === "app" ? "Start the selected application and play audio" : "No matching audio devices");
        return;
      }
      const nodes = items.map((item) => {
        let row = rows.get(item.id);
        if (!row) {
          const el = h("div", "deck-channel");
          const name = h("div", "deck-channel-name", item.name);
          const signal = meter(item.peak);
          const kind = mode === "app" || mode === "apps" ? "session" : "device";
          const controls = slider(item.name + " volume", (value) => deckCommand(kind, { id: item.id, value }));
          const mute = button("Mute", () => deckCommand(kind, { id: item.id, muted: !row.item.muted }), "Mute " + item.name);
          const balance = [];
          el.append(name, signal);
          if (mode === "balance") {
            const left = slider("Left channel", (value) => deckCommand("device", { id: item.id, op: "left", value }));
            const right = slider("Right channel", (value) => deckCommand("device", { id: item.id, op: "right", value }));
            left.set(item.volume);
            right.set(item.volume);
            balance.push(left, right);
            el.append(h("label", "", "L", left.input, left.number), h("label", "", "R", right.input, right.number));
          } else if (mode !== "meter") el.append(controls.input, h("div", "deck-channel-foot", controls.number, mute));
          row = { el, name, signal, controls, mute, item, balance };
          rows.set(item.id, row);
        }
        row.item = item;
        row.name.textContent = item.name;
        row.controls.set(item.volume);
        row.mute.textContent = item.muted ? t("w.unmute") : t("w.mute");
        row.controls.input.disabled = item.canControl === false;
        row.mute.disabled = item.canControl === false;
        row.balance.forEach((slider2, channel) => {
          var _a2;
          const value = (_a2 = item.channelVolumes) == null ? void 0 : _a2[channel];
          slider2.input.disabled = value == null;
          slider2.set(value || 0);
          if (value == null) slider2.number.textContent = "n/a";
        });
        row.mute.setAttribute("aria-pressed", String(item.muted));
        row.el.classList.toggle("deck-muted", item.muted);
        row.signal.firstChild.style.transform = `scaleX(${Math.max(0, Math.min(1, item.peak || 0))})`;
        return row.el;
      });
      reconcile(root, nodes);
      for (const key of rows.keys()) if (!items.some((item) => item.id === key)) rows.delete(key);
    };
  }
  function chooser(box, options, which) {
    const list = h("div", "deck-list");
    box.append(list);
    let signature = "";
    return (data) => {
      var _a, _b, _c, _d, _e;
      const items = which === "media" ? data.media || [] : which === "plans" ? data.powerPlans || [] : (((_a = data.audio) == null ? void 0 : _a.devices) || []).filter((d) => d.direction === which);
      const role = options.role || "all";
      const roleIndex = { console: 0, media: 1, communications: 2 }[role];
      const chosen = which === "media" ? (_b = selectedPlayer(data, options)) == null ? void 0 : _b.id : roleIndex != null && ["input", "output"].includes(which) ? (_d = (_c = data.audio) == null ? void 0 : _c.defaults) == null ? void 0 : _d[which + ":" + roleIndex] : (_e = items.find((d) => d.default || d.state === "Active")) == null ? void 0 : _e.id;
      const key = JSON.stringify([items.map((i) => [i.id, i.name]), chosen]);
      if (key === signature) return;
      signature = key;
      if (!items.length) {
        empty(list, which === "media" ? "Start a media player on the computer" : "No compatible devices found");
        return;
      }
      list.replaceChildren(...items.map((item) => {
        const b = button(item.name, () => __async(this, null, function* () {
          if (which === "media") store.set("control-player", item.id);
          else yield deckCommand(which === "plans" ? "power-plan" : "default", { id: item.id, op: role });
          signature = "";
        }));
        b.classList.toggle("selected", item.id === chosen);
        b.setAttribute("aria-pressed", String(item.id === chosen));
        return b;
      }));
    };
  }
  function hold(box, options, power = null) {
    const b = h("button", "deck-hold", power ? `Hold: ${power}` : "Hold to talk");
    b.type = "button";
    b.disabled = true;
    const status = h("div", "deck-caption", power ? "Hold for 2 seconds" : "Release to restore the microphone");
    box.append(b, status);
    let held = false, lease = null, timer = 0, renewal = 0, device = null;
    const end = () => __async(this, null, function* () {
      held = false;
      clearTimeout(timer);
      clearInterval(renewal);
      b.classList.remove("held");
      const old = lease;
      lease = null;
      if (old && !power) try {
        yield deckCommand("ptt", { op: "end", lease: old });
      } catch (_) {
      }
    });
    const begin = (event) => __async(this, null, function* () {
      if (held || b.disabled) return;
      event.preventDefault();
      held = true;
      b.classList.add("held");
      if (event.pointerId != null) try {
        b.setPointerCapture(event.pointerId);
      } catch (_) {
      }
      try {
        const result = yield deckCommand(power ? "power-arm" : "ptt", { id: power || device, op: "begin" });
        lease = result.lease;
        if (!held) {
          yield end();
          return;
        }
        if (power) timer = setTimeout(() => __async(this, null, function* () {
          try {
            yield deckCommand("power", { id: power, lease });
            status.textContent = "Power action scheduled";
          } catch (e) {
            fail(e);
          }
          yield end();
        }), 1700);
        else renewal = setInterval(() => deckCommand("ptt", { op: "renew", lease }).catch(end), 1e3);
      } catch (e) {
        fail(e);
        yield end();
      }
    });
    b.onpointerdown = begin;
    b.onpointerup = end;
    b.onpointercancel = end;
    b.onlostpointercapture = end;
    b.onkeydown = (e) => {
      if (!e.repeat && (e.key === " " || e.key === "Enter")) begin(e);
    };
    b.onkeyup = end;
    const visibility = () => {
      if (document.hidden) end();
    };
    const observer = typeof IntersectionObserver === "function" ? new IntersectionObserver((entries) => {
      if (entries.some((entry) => !entry.isIntersecting)) end();
    }) : null;
    observer == null ? void 0 : observer.observe(b);
    window.addEventListener("blur", end);
    document.addEventListener("visibilitychange", visibility);
    return {
      render(data) {
        var _a, _b, _c;
        device = options.device || ((_c = (_b = (_a = data.audio) == null ? void 0 : _a.devices) == null ? void 0 : _b.find((d) => d.direction === "input" && d.default)) == null ? void 0 : _c.id);
        b.disabled = power ? !data.allowPower : !device;
        if (b.disabled) status.textContent = power ? "Enable power controls in desktop settings" : "No microphone is available";
      },
      destroy() {
        end();
        observer == null ? void 0 : observer.disconnect();
        window.removeEventListener("blur", end);
        document.removeEventListener("visibilitychange", visibility);
      }
    };
  }
  function mediaView(box, options, mode) {
    const title = h("div", "deck-track"), source = h("div", "deck-caption");
    box.append(title, source);
    let current = null;
    const call = (op, value) => current ? deckCommand("media", { id: current.id, op, value }) : Promise.reject(new Error("No media player selected"));
    const controls = h("div", "deck-toolbar");
    box.append(controls);
    let seek = null, shuffle = null, repeat = null;
    if (mode === "seek") {
      seek = slider("Playback position", (value) => call("seek", value));
      box.append(seek.input, seek.number);
    } else if (mode === "modes") {
      shuffle = button("Shuffle", () => call("shuffle", current.shuffle ? 0 : 1));
      repeat = button("Repeat", () => call("repeat", current.repeat === "None" ? 1 : current.repeat === "Track" ? 2 : 0));
      controls.append(shuffle, repeat);
    } else controls.append(button("\u23EE", () => call("prev"), "Previous track"), button("\u23EF", () => call("playpause"), "Play or pause"), button("\u23ED", () => call("next"), "Next track"));
    return (data) => {
      current = selectedPlayer(data, options);
      title.textContent = (current == null ? void 0 : current.title) || t("w.noMediaSelected");
      source.textContent = (current == null ? void 0 : current.name) || "Choose a source in Media sources";
      controls.querySelectorAll("button").forEach((b) => b.disabled = !current);
      if (seek) {
        seek.input.max = Math.max(1, (current == null ? void 0 : current.duration) || 1);
        seek.set((current == null ? void 0 : current.position) || 0);
        seek.number.textContent = `${Math.floor(((current == null ? void 0 : current.position) || 0) / 1e3)} / ${Math.floor(((current == null ? void 0 : current.duration) || 0) / 1e3)} s`;
        seek.input.disabled = !(current == null ? void 0 : current.canSeek);
      }
      if (shuffle) {
        shuffle.disabled = !(current == null ? void 0 : current.canShuffle);
        shuffle.setAttribute("aria-pressed", String(!!(current == null ? void 0 : current.shuffle)));
      }
      if (repeat) {
        repeat.disabled = !(current == null ? void 0 : current.canRepeat);
        repeat.textContent = "Repeat: " + ((current == null ? void 0 : current.repeat) || "None");
      }
    };
  }
  var groups = {
    "app-dock": ["app", "shortcut"],
    hotkeys: ["keys"],
    "macro-pad": ["macro"],
    "window-layouts": ["window-layout"],
    "project-launcher": ["project", "app"],
    snippets: ["snippet", "text"],
    presentation: ["presentation"],
    "display-profiles": ["display-profile"],
    "focus-profile": ["focus", "macro"],
    "meeting-controls": ["meeting"],
    "discord-controls": ["discord"],
    "meeting-profile": ["meeting", "macro"],
    "task-runner": ["task"],
    "dev-servers": ["server"],
    services: ["service"],
    "workflow-runner": ["workflow"],
    "script-pad": ["task", "shortcut"],
    soundboard: ["sound"],
    radio: ["radio"],
    playlists: ["playlist"],
    "audio-routing": ["audio-route"],
    "external-mixer": ["mixer", "mixer-mute"],
    "midi-pad": ["midi"],
    "osc-pad": ["osc"]
  };
  function actionsView(box, options, type) {
    const grid = h("div", "deck-actions");
    box.append(grid);
    let signature = "";
    return (data) => {
      var _a;
      const permitted = groups[type] || [];
      let items = [...data.actions || [], ...(data.shortcuts || []).map((s) => __spreadProps(__spreadValues({}, s), { id: "shortcut:" + s.id }))].filter((item) => permitted.includes(item.kind));
      if (type === "focus-profile" || type === "meeting-profile") items.push(...data.profiles || []);
      if ((_a = options.ids) == null ? void 0 : _a.length) items = items.filter((item) => options.ids.includes(item.id));
      const key = JSON.stringify(items);
      if (key === signature) return;
      signature = key;
      if (!items.length) {
        empty(grid, "Assign controls in the computer\u2019s Control Deck settings");
        return;
      }
      grid.replaceChildren(...items.map((item) => {
        const label = h("span", "", item.name), state = h("small", "", item.state || "Ready");
        const b = button("", () => __async(this, null, function* () {
          yield deckCommand(item.kind === "profile" ? "profile" : "action", { id: item.id, op: item.kind === "radio" ? "toggle" : type === "app-dock" ? "focus" : "" });
          signature = "";
        }));
        b.disabled = item.available === false;
        b.append(label, state);
        if (type === "dev-servers") return h("div", "deck-task", b, button("Stop", () => deckCommand("action", { id: item.id, op: "stop" }), "Stop " + item.name));
        if (type === "soundboard") return h("div", "deck-task", b, button("Stop", () => deckCommand("sound-stop", { id: item.id }), "Stop " + item.name));
        return b;
      }));
    };
  }
  function radioInitials(label) {
    const parts = (label || "FM").replace(/\([^)]*\)/g, "").trim().split(/[\s\-_.]+/).filter(Boolean);
    if (!parts.length) return "FM";
    const chars = (s, n) => Array.from(s).slice(0, n).join("");
    return parts.length > 1 ? (chars(parts[0], 1) + chars(parts[1], 1)).toUpperCase() : chars(parts[0], 2).toUpperCase();
  }
  function radioView(box, options) {
    const isCarousel = options.view === "carousel";
    box.classList.add("deck-radio-widget", isCarousel ? "is-carousel" : "is-grid");
    const wrap = h("div", isCarousel ? "radio-carousel" : "radio-grid-wrap");
    const track = h("div", isCarousel ? "radio-carousel-track" : "radio-grid");
    let prevBtn = null, nextBtn = null;
    const syncNav = () => {
      if (!isCarousel) return;
      const max = Math.max(0, track.scrollWidth - track.clientWidth);
      const canScroll = max > 6;
      wrap.classList.toggle("can-scroll", canScroll);
      if (prevBtn) prevBtn.disabled = !canScroll || track.scrollLeft <= 4;
      if (nextBtn) nextBtn.disabled = !canScroll || track.scrollLeft >= max - 4;
    };
    if (isCarousel) {
      const stepScroll = (dir) => {
        haptic();
        const step = Math.max(130, Math.round(track.clientWidth * 0.72));
        track.scrollBy({ left: dir * step, behavior: "smooth" });
      };
      prevBtn = h("button", "radio-nav radio-nav-prev", "\u2039");
      prevBtn.type = "button";
      prevBtn.setAttribute("aria-label", "Previous stations");
      prevBtn.onclick = (e) => {
        e.stopPropagation();
        stepScroll(-1);
      };
      nextBtn = h("button", "radio-nav radio-nav-next", "\u203A");
      nextBtn.type = "button";
      nextBtn.setAttribute("aria-label", "Next stations");
      nextBtn.onclick = (e) => {
        e.stopPropagation();
        stepScroll(1);
      };
      track.addEventListener("scroll", syncNav, { passive: true });
      let startX = 0, startY = 0;
      track.addEventListener("touchstart", (e) => {
        if (e.touches.length !== 1) return;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }, { passive: true });
      track.addEventListener("touchmove", (e) => {
        if (e.touches.length !== 1) return;
        const dx = e.touches[0].clientX - startX;
        const dy = e.touches[0].clientY - startY;
        if (Math.abs(dx) <= Math.abs(dy)) return;
        const max = Math.max(0, track.scrollWidth - track.clientWidth);
        if (max <= 1 || track.scrollLeft <= 0 && dx > 0 || track.scrollLeft >= max - 1 && dx < 0) {
          if (e.cancelable) e.preventDefault();
        }
      }, { passive: false });
      let dragDown = false, dragged = false, dragStartX = 0, dragScrollLeft = 0;
      track.addEventListener("pointerdown", (e) => {
        if (e.pointerType !== "mouse" || e.button !== 0) return;
        dragDown = true;
        dragged = false;
        dragStartX = e.clientX;
        dragScrollLeft = track.scrollLeft;
      });
      track.addEventListener("pointermove", (e) => {
        if (!dragDown) return;
        const dx = e.clientX - dragStartX;
        if (Math.abs(dx) > 6) {
          dragged = true;
          track.classList.add("is-dragging");
        }
        if (dragged) track.scrollLeft = dragScrollLeft - dx;
      });
      const endDrag = () => {
        if (!dragDown) return;
        dragDown = false;
        track.classList.remove("is-dragging");
        if (dragged) setTimeout(() => {
          dragged = false;
        }, 0);
      };
      track.addEventListener("pointerup", endDrag);
      track.addEventListener("pointercancel", endDrag);
      track.addEventListener("pointerleave", endDrag);
      track.addEventListener("click", (e) => {
        if (dragged) {
          e.preventDefault();
          e.stopPropagation();
          dragged = false;
        }
      }, true);
      track.addEventListener("wheel", (e) => {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && track.scrollWidth > track.clientWidth) {
          const max = Math.max(0, track.scrollWidth - track.clientWidth);
          const canLeft = e.deltaY < 0 && track.scrollLeft > 0;
          const canRight = e.deltaY > 0 && track.scrollLeft < max;
          if (canLeft || canRight) {
            e.preventDefault();
            track.scrollLeft += e.deltaY;
          }
        }
      }, { passive: false });
      wrap.append(prevBtn, track, nextBtn);
    } else {
      wrap.append(track);
    }
    box.append(wrap);
    const cards = /* @__PURE__ */ new Map();
    let latestItems = [];
    let optimisticId = null;
    let optimisticUntil = 0;
    let lastScrolledPlayingId = "";
    let cmdSeq = 0;
    let commandBusy = false;
    const effectivePlayingId = () => {
      var _a;
      if (optimisticId !== null && performance.now() < optimisticUntil) return optimisticId;
      optimisticId = null;
      return ((_a = latestItems.find((i) => i.state === "Playing")) == null ? void 0 : _a.id) || "";
    };
    const syncCardsState = (allowAutoScroll) => {
      const activeId = effectivePlayingId();
      for (const [id, entry] of cards.entries()) {
        const playing = id === activeId;
        const unavail = entry.item.available === false;
        const subState = unavail && entry.item.state ? entry.item.state : "";
        entry.el.classList.toggle("is-playing", playing);
        entry.el.setAttribute("aria-pressed", String(playing));
        entry.el.disabled = unavail;
        entry.el.title = subState || entry.item.name;
        entry.name.textContent = subState ? `${entry.item.name} \xB7 ${subState}` : entry.item.name;
        entry.fallback.textContent = radioInitials(entry.item.name);
        entry.el.setAttribute("aria-label", entry.item.name + (playing ? " (Playing)" : subState ? ` (${subState})` : ""));
      }
      if (isCarousel && allowAutoScroll && activeId && activeId !== lastScrolledPlayingId) {
        const activeEntry = cards.get(activeId);
        if (activeEntry) {
          const firstMount = !lastScrolledPlayingId;
          lastScrolledPlayingId = activeId;
          requestAnimationFrame(() => {
            const target = Math.max(0, activeEntry.el.offsetLeft - (track.clientWidth - activeEntry.el.offsetWidth) / 2);
            track.scrollTo({ left: target, behavior: firstMount ? "auto" : "smooth" });
            syncNav();
          });
        }
      } else if (!activeId) {
        lastScrolledPlayingId = "";
      }
    };
    const filterItems = (actions) => {
      var _a;
      const list = (actions || []).filter((item) => item.kind === "radio");
      if (!((_a = options.ids) == null ? void 0 : _a.length)) return list;
      const byId = new Map(list.map((item) => [item.id, item]));
      return options.ids.map((id) => byId.get(id)).filter(Boolean);
    };
    return (data) => {
      const items = filterItems(data.actions);
      latestItems = items;
      if (!items.length) {
        cards.clear();
        empty(track, "Assign radio streams in the computer\u2019s Control Deck settings");
        syncNav();
        return;
      }
      const emptyEl = track.querySelector(".deck-empty");
      if (emptyEl) emptyEl.remove();
      const nodes = items.map((item) => {
        let entry = cards.get(item.id);
        if (!entry) {
          const fallback = h("span", "radio-fallback", radioInitials(item.name));
          const img = h("img", "radio-logo");
          img.alt = "";
          img.loading = "lazy";
          img.decoding = "async";
          img.draggable = false;
          const eq = h("span", "radio-eq", h("i"), h("i"), h("i"));
          eq.setAttribute("aria-hidden", "true");
          const logoBox = h("div", "radio-logo-box", fallback, img, eq);
          img.onload = () => logoBox.classList.add("has-logo");
          img.onerror = () => logoBox.classList.remove("has-logo");
          const name = h("span", "radio-name", item.name);
          const el = h("button", "radio-card");
          el.type = "button";
          el.append(logoBox, name);
          entry = { el, img, name, fallback, logoBox, item, busy: false, logoKey: "" };
          el.onclick = () => __async(this, null, function* () {
            if (commandBusy || entry.busy) return;
            haptic();
            const seq = ++cmdSeq;
            const wasPlaying = effectivePlayingId() === entry.item.id;
            optimisticId = wasPlaying ? "" : entry.item.id;
            optimisticUntil = performance.now() + 3e3;
            lastScrolledPlayingId = optimisticId;
            syncCardsState(false);
            if (isCarousel && optimisticId) {
              const target = Math.max(0, el.offsetLeft - (track.clientWidth - el.offsetWidth) / 2);
              track.scrollTo({ left: target, behavior: "smooth" });
            }
            commandBusy = true;
            entry.busy = true;
            try {
              yield deckCommand("action", { id: entry.item.id, op: "toggle" });
              const fresh = yield deckState(true);
              if (seq !== cmdSeq) return;
              latestItems = filterItems(fresh.actions);
              for (const next of latestItems) {
                const c = cards.get(next.id);
                if (c) c.item = next;
              }
              optimisticId = null;
              optimisticUntil = 0;
              syncCardsState(false);
            } catch (e) {
              if (seq === cmdSeq) {
                optimisticId = null;
                optimisticUntil = 0;
                syncCardsState(false);
              }
              fail(e);
            } finally {
              commandBusy = false;
              entry.busy = false;
            }
          });
          cards.set(item.id, entry);
        } else {
          entry.item = item;
        }
        return entry.el;
      });
      reconcile(track, nodes);
      for (const [id, entry] of cards.entries()) {
        const rev = entry.item.rev || entry.item.name || "";
        const nextKey = `${id}:${rev}`;
        if (entry.logoKey !== nextKey) {
          entry.logoKey = nextKey;
          entry.logoBox.classList.remove("has-logo");
          entry.img.src = `${API}/controls/radio-logo?id=${encodeURIComponent(id)}&v=${encodeURIComponent(rev)}`;
        }
      }
      for (const id of [...cards.keys()]) {
        if (!items.some((i) => i.id === id)) cards.delete(id);
      }
      syncCardsState(true);
      requestAnimationFrame(syncNav);
    };
  }
  function mixerView(box, options) {
    const root = h("div", "deck-list");
    box.append(root);
    const rows = /* @__PURE__ */ new Map();
    return (data) => {
      const items = (data.actions || []).filter((a) => {
        var _a;
        return ["mixer", "mixer-mute"].includes(a.kind) && (!((_a = options.ids) == null ? void 0 : _a.length) || options.ids.includes(a.id));
      });
      if (!items.length) {
        empty(root, "Configure Voicemeeter bindings in desktop settings");
        return;
      }
      reconcile(root, items.map((item) => {
        let row = rows.get(item.id);
        if (!row) {
          const el = h("div", "deck-channel"), label = h("div", "deck-channel-name", item.name), state = h("div", "deck-caption");
          el.append(label, state);
          row = { el, label, state, item };
          if (item.kind === "mixer") {
            row.slider = slider(item.name + " gain", (value) => deckCommand("action", { id: item.id, value }), 12);
            row.slider.input.min = -60;
            el.append(row.slider.input, row.slider.number);
          } else {
            row.toggle = button("Toggle", () => deckCommand("action", { id: item.id, value: Number(row.item.state) > 0 ? 0 : 1 }));
            el.append(row.toggle);
          }
          rows.set(item.id, row);
        }
        row.item = item;
        row.label.textContent = item.name;
        row.state.textContent = item.available === false ? item.state || t("w.notConnected") : "";
        if (row.slider) {
          row.slider.input.disabled = item.available === false;
          row.slider.set(Number(item.state) || 0);
          row.slider.number.textContent = item.available === false ? "n/a" : item.state + " dB";
        }
        if (row.toggle) {
          row.toggle.disabled = item.available === false;
          row.toggle.textContent = Number(item.state) > 0 ? t("w.disable") : t("w.enable");
          row.toggle.setAttribute("aria-pressed", String(Number(item.state) > 0));
        }
        return row.el;
      }));
      for (const id of rows.keys()) if (!items.some((i) => i.id === id)) rows.delete(id);
    };
  }
  function listening(box) {
    const state = h("div", "deck-caption", t("w.listeningOff"));
    let ctl = null, context = null, next = 0, check = 0;
    const stop = () => {
      ctl == null ? void 0 : ctl.abort();
      ctl = null;
      context == null ? void 0 : context.close();
      context = null;
      clearInterval(check);
      toggle.textContent = t("w.listen");
      state.textContent = t("w.listeningOff");
    };
    const toggle = button(t("w.listen"), () => __async(this, null, function* () {
      if (ctl) {
        stop();
        return;
      }
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio || !window.ReadableStream) throw new Error("This WebView does not support live audio");
      context = new Audio();
      yield context.resume();
      ctl = new AbortController();
      toggle.textContent = t("w.stopListening");
      state.textContent = t("w.listeningOn");
      const own = ctl;
      check = setInterval(() => {
        const r = box.getBoundingClientRect();
        if (document.hidden || r.right <= 0 || r.left >= innerWidth) stop();
      }, 250);
      (() => __async(this, null, function* () {
        try {
          const response = yield fetch(API + "/controls/listen", { headers: PANEL_HEADERS, signal: own.signal });
          if (!response.ok || !response.body) throw new Error("Listening is unavailable");
          const reader = response.body.getReader(), decoder = new TextDecoder();
          let text = "";
          while (ctl === own) {
            const chunk = yield reader.read();
            if (chunk.done) break;
            text += decoder.decode(chunk.value, { stream: true });
            if (text.length > 1e6) throw new Error("Invalid audio stream");
            let newline;
            while ((newline = text.indexOf("\n")) >= 0) {
              const packet = JSON.parse(text.slice(0, newline));
              text = text.slice(newline + 1);
              if (!packet.data || !context) continue;
              const raw = Uint8Array.from(atob(packet.data), (c) => c.charCodeAt(0));
              const view = new DataView(raw.buffer);
              const bytes = packet.bits / 8, frames = raw.length / bytes / packet.channels;
              if (!Number.isInteger(frames) || ![16, 32].includes(packet.bits)) throw new Error("Unsupported audio format");
              const buffer = context.createBuffer(packet.channels, frames, packet.rate);
              for (let channel = 0; channel < packet.channels; channel++) {
                const samples = buffer.getChannelData(channel);
                for (let frame2 = 0; frame2 < frames; frame2++) {
                  const offset = (frame2 * packet.channels + channel) * bytes;
                  samples[frame2] = packet.encoding === "IeeeFloat" ? view.getFloat32(offset, true) : packet.bits === 16 ? view.getInt16(offset, true) / 32768 : view.getInt32(offset, true) / 2147483648;
                }
              }
              const source = context.createBufferSource();
              source.buffer = buffer;
              source.connect(context.destination);
              if (next < context.currentTime || next > context.currentTime + 0.5) next = context.currentTime + 0.06;
              source.start(next);
              next += buffer.duration;
            }
          }
        } catch (e) {
          if (!own.signal.aborted) fail(e);
        } finally {
          if (ctl === own) stop();
        }
      }))();
    }));
    toggle.disabled = true;
    box.append(toggle, state);
    return { render(data) {
      toggle.disabled = !data.allowListening;
      if (!data.allowListening) state.textContent = "Enable listening in desktop settings";
    }, destroy: stop };
  }
  function registerDeckWidget(type, title, mode = type) {
    W[type] = {
      needs: ["tick"],
      create(box, { o }) {
        box.classList.add("control-deck");
        box.append(h("div", "w-title", o.title || title));
        let render = null, component = null, alive = true, loading = false;
        if (["apps", "app", "mic", "output", "balance", "meter"].includes(mode)) render = audioView(box, o, mode);
        else if (mode === "external-mixer") render = mixerView(box, o);
        else if (mode === "inputs" || mode === "outputs") render = chooser(box, o, mode === "inputs" ? "input" : "output");
        else if (mode === "sources" || mode === "plans") render = chooser(box, o, mode === "sources" ? "media" : "plans");
        else if (mode === "ptt") component = hold(box, o);
        else if (mode === "listen") component = listening(box);
        else if (["remote", "seek", "modes"].includes(mode)) render = mediaView(box, o, mode);
        else if (mode === "panic") box.append(button("Mute audio + microphones", () => deckCommand("panic")));
        else if (mode === "desktops") box.append(button("\u2190 Desktop", () => deckCommand("desktop", { value: -1 })), button("Desktop \u2192", () => deckCommand("desktop", { value: 1 })));
        else if (mode === "system") box.append(button("Lock", () => deckCommand("lock")), button("Display off", () => deckCommand("monitor-off")));
        else if (mode === "power") {
          const group = h("div", "deck-power-grid");
          box.append(group);
          const components = ["sleep", "restart", "shutdown"].map((action) => {
            const item = h("div", "deck-power-item");
            group.append(item);
            return hold(item, o, action);
          });
          component = { render(data) {
            components.forEach((c) => c.render(data));
          }, destroy() {
            components.forEach((c) => c.destroy());
          } };
        } else if (mode === "duck") {
          let enabled = false;
          const b = button("Enable ducking", () => {
            var _a2;
            return deckCommand("duck", { op: enabled ? "off" : "on", value: (_a2 = o.level) != null ? _a2 : 25 });
          });
          box.append(b);
          render = (data) => {
            enabled = data.ducking;
            b.textContent = enabled ? t("w.disableDucking") : t("w.enableDucking");
            b.setAttribute("aria-pressed", String(enabled));
          };
        } else if (mode === "profiles") {
          const list = h("div", "deck-actions");
          box.append(list);
          let key = "";
          render = (data) => {
            var _a2;
            const next = JSON.stringify(data.profiles);
            if (next === key) return;
            key = next;
            if (!((_a2 = data.profiles) == null ? void 0 : _a2.length)) empty(list, "Save an audio profile in desktop settings");
            else list.replaceChildren(...data.profiles.map((p) => button(p.name, () => deckCommand("profile", { id: p.id }))));
          };
        } else if (mode === "sleep") {
          let player = null;
          const caption = h("div", "deck-caption");
          box.append(
            button(`Sleep in ${o.minutes || 30} min`, () => deckCommand("sleep", { id: (player == null ? void 0 : player.id) || "", value: o.minutes || 30 })),
            button("Cancel timer", () => deckCommand("sleep", { id: (player == null ? void 0 : player.id) || "", value: 0 })),
            caption
          );
          render = (data) => {
            var _a2;
            player = selectedPlayer(data, o);
            const timer = (_a2 = data.sleep) == null ? void 0 : _a2.find((t2) => t2.id === (player == null ? void 0 : player.id));
            caption.textContent = timer ? `Pausing ${(player == null ? void 0 : player.name) || "player"} in ${Math.max(0, Math.ceil((timer.at - Date.now()) / 6e4))} min` : t("w.noSleepTimer");
          };
        } else if (mode === "brightness") {
          const list = h("div", "deck-list");
          box.append(list);
          const rows = /* @__PURE__ */ new Map();
          render = (data) => {
            const items = (data.monitors || []).filter((m) => !o.device || m.id === o.device);
            if (!items.length) {
              empty(list, t("w.noMonitors"));
              return;
            }
            reconcile(list, items.map((m) => {
              if (!rows.has(m.id)) {
                const s = slider(m.name + " brightness", (value) => deckCommand("brightness", { id: m.id, value }));
                rows.set(m.id, __spreadProps(__spreadValues({}, s), { el: h("div", "deck-channel", h("div", "deck-channel-name", m.name), s.input, s.number) }));
              }
              const row = rows.get(m.id);
              row.input.disabled = m.brightness == null;
              row.set(m.brightness || 0);
              if (m.brightness == null) row.number.textContent = "DDC/CI unavailable";
              return row.el;
            }));
          };
        } else if (mode === "radio") render = radioView(box, o);
        else render = actionsView(box, o, type);
        return {
          update() {
            return __async(this, null, function* () {
              if (loading || !alive || !render && !component) return;
              loading = true;
              try {
                const data = yield deckState();
                if (alive) {
                  render == null ? void 0 : render(data);
                  component == null ? void 0 : component.render(data);
                  box.classList.remove("deck-offline");
                }
              } catch (_) {
                if (alive) box.classList.add("deck-offline");
              } finally {
                loading = false;
              }
            });
          },
          destroy() {
            alive = false;
            component == null ? void 0 : component.destroy();
          }
        };
      }
    };
  }
  for (const [type, title, mode] of [
    ["audio-mixer", "Application mixer", "apps"],
    ["app-volume", "Application volume", "app"],
    ["device-volume", "Device volume", "output"],
    ["audio-balance", "Channel balance", "balance"],
    ["audio-meter", "Audio levels", "meter"],
    ["panic-mute", "Emergency mute", "panic"],
    ["microphone", "Microphone", "mic"],
    ["audio-inputs", "Microphone selection", "inputs"],
    ["audio-outputs", "Output selection", "outputs"],
    ["push-to-talk", "Push to talk", "ptt"],
    ["audio-profiles", "Audio profiles", "profiles"],
    ["audio-ducking", "Audio ducking", "duck"],
    ["media-sources", "Media sources", "sources"],
    ["media-remote", "Media remote", "remote"],
    ["media-seek", "Playback position", "seek"],
    ["media-modes", "Shuffle and repeat", "modes"],
    ["media-sleep", "Music sleep timer", "sleep"],
    ["brightness", "Display brightness", "brightness"],
    ["power-plans", "Power plans", "plans"],
    ["desktops", "Virtual desktops", "desktops"],
    ["system-keys", "Lock and displays", "system"],
    ["power-controls", "Power controls", "power"],
    ["pc-listen", "Listen to PC audio", "listen"]
  ]) registerDeckWidget(type, title, mode);
  for (const type of Object.keys(groups)) registerDeckWidget(type, type.split("-").map((s) => s[0].toUpperCase() + s.slice(1)).join(" "));
  W["meeting-status"] = W.onair;
  function integrationCommand(_0) {
    return __async(this, arguments, function* (path, values = {}) {
      const result = yield api("/controls/" + path + "?" + new URLSearchParams(values), "POST", 2e4);
      if (!result.ok) throw new Error(result.error || "Integration refused this control");
      return result;
    });
  }
  function integrationWidget(type, title, endpoint, create) {
    W[type] = { needs: ["tick"], create(box, { o }) {
      box.classList.add("control-deck");
      box.append(h("div", "w-title", o.title || title));
      const root = h("div", "deck-list");
      box.append(root);
      let alive = true, busy = false, signature = "", data = null;
      return { update() {
        return __async(this, null, function* () {
          if (!alive || busy) return;
          busy = true;
          try {
            data = yield api("/controls/" + endpoint, "GET", 2e4);
            if (!alive) return;
            if (root.contains(document.activeElement) && document.activeElement.matches("input,textarea,select") || root.matches(":active") || root.querySelector(":active")) return;
            const key = JSON.stringify(data);
            if (key === signature) return;
            signature = key;
            if (!data.connected) {
              empty(root, data.error || "Connect this integration in desktop settings");
              return;
            }
            root.replaceChildren();
            create(root, data, (action, args) => integrationCommand(endpoint === "obs" ? "obs/" + action : "spotify/action/" + action, args).then(() => {
              signature = "";
            }), o);
          } catch (error) {
            if (alive) empty(root, error.message || "Integration is unavailable");
          } finally {
            busy = false;
          }
        });
      }, destroy() {
        alive = false;
      } };
    } };
  }
  var timeText = (ms) => {
    const s = Math.floor((ms || 0) / 1e3);
    return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
  };
  integrationWidget("obs-mixer", "OBS mixer", "obs", (root, data, send) => {
    var _a;
    if (!((_a = data.inputs) == null ? void 0 : _a.length)) {
      empty(root, "No OBS inputs found");
      return;
    }
    for (const input of data.inputs) {
      const s = slider(input.name + " volume", (value) => send("volume", { id: input.id, value }));
      s.set(input.volume || 0);
      s.input.disabled = input.volume == null;
      const mute = button(input.muted ? "Unmute" : "Mute", () => send("mute", { id: input.id, enabled: !input.muted }), "Mute " + input.name);
      mute.disabled = input.muted == null;
      root.append(h("div", "deck-channel", h("div", "deck-channel-name", input.name), s.input, h("div", "deck-channel-foot", s.number, mute)));
    }
  });
  integrationWidget("obs-scenes", "OBS scenes", "obs", (root, data, send) => {
    for (const name of data.scenes || []) {
      const b = button(name, () => send("scene", { id: name }));
      b.classList.toggle("selected", name === data.scene);
      root.append(b);
    }
  });
  integrationWidget("obs-sources", "OBS sources", "obs", (root, data, send) => {
    var _a;
    if (!((_a = data.sources) == null ? void 0 : _a.length)) empty(root, "No sources in the current scene");
    for (const source of data.sources || []) {
      const b = button((source.enabled ? "\u25CF " : "\u25CB ") + source.name, () => send("source", { id: source.id, enabled: !source.enabled }));
      b.setAttribute("aria-pressed", String(source.enabled));
      root.append(b);
    }
  });
  integrationWidget("obs-recording", "OBS recording and stream", "obs", (root, data, send) => {
    root.append(
      h("div", "deck-track", "Recording " + timeText(data.recordMs)),
      h("div", "deck-caption", "Stream " + timeText(data.streamMs)),
      button(data.recording ? "Stop recording" : "Start recording", () => send("record")),
      button(data.streaming ? "Stop stream" : "Start stream", () => send("stream"))
    );
    const pause = button(data.recordPaused ? "Resume recording" : "Pause recording", () => send("pause"));
    pause.disabled = !data.recording;
    root.append(pause);
  });
  integrationWidget("obs-replay", "OBS replay buffer", "obs", (root, data, send) => {
    const toggle = button(data.replayActive ? "Stop replay buffer" : "Start replay buffer", () => send("replay"));
    toggle.disabled = !data.replayAvailable;
    const save = button("Save replay", () => send("save-replay"));
    save.disabled = !data.replayActive;
    root.append(toggle, save);
  });
  integrationWidget("obs-transition", "OBS transition", "obs", (root, data, send) => {
    for (const t2 of data.transitions || []) {
      const b = button(t2.transitionName, () => send("transition", { id: t2.transitionName }));
      b.classList.toggle("selected", data.transition === t2.transitionName);
      root.append(b);
    }
    const s = slider("Transition duration", (value) => send("duration", { value }), 1e4);
    s.input.min = 50;
    s.input.step = 50;
    s.set(data.duration || 300);
    s.input.disabled = data.duration == null;
    root.append(s.input, s.number);
  });
  integrationWidget("obs-camera", "OBS virtual camera", "obs", (root, data, send) => {
    const b = button(data.cameraActive ? "Stop virtual camera" : "Start virtual camera", () => send("camera"));
    b.disabled = !data.cameraAvailable;
    root.append(b);
  });
  var SPOTIFY_COVER = /^https:\/\/i\.scdn\.co\/image\/[A-Za-z0-9]+$/;
  integrationWidget("media-queue", "Spotify queue", "spotify/state", (root, data, send, o) => {
    var _a;
    const cover = (url) => {
      if (o.covers === false) return null;
      const c = h("span", "sq-cover");
      if (SPOTIFY_COVER.test(url || "")) {
        const img = h("img");
        img.alt = "";
        img.decoding = "async";
        img.referrerPolicy = "no-referrer";
        img.onerror = () => img.remove();
        img.src = url;
        c.append(img);
      }
      return c;
    };
    const text = (name, artist) => h("div", "sq-txt", h("div", "sq-name", name || ""), artist ? h("div", "sq-artist", artist) : null);
    const cur = data.current;
    root.classList.add("sq");
    root.append(h(
      "div",
      "sq-now" + (data.playing ? " playing" : ""),
      cover(cur == null ? void 0 : cur.image),
      h(
        "div",
        "sq-txt",
        h("div", "sq-label", t(cur ? "w.nowPlaying" : "w.nothingPlaying")),
        cur ? h("div", "sq-name", cur.name || "") : null,
        (cur == null ? void 0 : cur.artist) ? h("div", "sq-artist", cur.artist) : null
      )
    ));
    if (!((_a = data.queue) == null ? void 0 : _a.length)) {
      root.append(h("div", "deck-empty", t("w.queueEmpty")));
      return;
    }
    root.append(h("div", "sq-head", t("w.upNext")));
    for (const item of data.queue) {
      const b = h("button", "sq-item", cover(item.image), text(item.name, item.artist));
      b.type = "button";
      b.setAttribute("aria-label", item.name + (item.artist ? " \xB7 " + item.artist : ""));
      b.onclick = () => {
        haptic();
        send("play-queued", { id: item.id }).catch(fail);
      };
      root.append(b);
    }
  });
  integrationWidget("media-favorites", "Spotify favorites", "spotify/state", (root, data, send) => {
    var _a, _b, _c;
    root.append(h("div", "deck-track", ((_a = data.current) == null ? void 0 : _a.name) || t("w.nothingPlaying")), h("div", "deck-caption", ((_b = data.current) == null ? void 0 : _b.artist) || ""));
    const b = button("Save to library", () => send("favorite"));
    b.disabled = !((_c = data.current) == null ? void 0 : _c.id);
    root.append(b);
  });
  W["meeting-timer"] = { needs: ["tick"], create(box, { o }) {
    const key = "meeting-timer:" + (o.timerId || "default");
    const clock = h("div", "deck-track");
    box.classList.add("control-deck");
    box.append(h("div", "w-title", o.title || "Meeting timer"), clock);
    let state = store.get(key, { elapsed: 0, started: 0 });
    const persist = () => store.set(key, state);
    const start = button(state.started ? "Pause" : "Start", () => {
      state = store.get(key, state);
      if (state.started) {
        state.elapsed += Date.now() - state.started;
        state.started = 0;
      } else state.started = Date.now();
      persist();
      render();
    });
    box.append(start, button("Reset", () => {
      state = { elapsed: 0, started: 0 };
      persist();
      render();
    }));
    function render() {
      state = store.get(key, state);
      const elapsed = state.elapsed + (state.started ? Date.now() - state.started : 0);
      clock.textContent = timeText(elapsed);
      start.textContent = state.started ? t("w.pause") : t("w.start");
      start.setAttribute("aria-label", start.textContent);
      clock.classList.toggle("deck-overdue", elapsed >= (o.minutes || 30) * 6e4);
    }
    render();
    return { update: render };
  } };

  // ../../../tmp/claude-0/-home-claude/d7433526-111a-5017-bcc4-3fd104415c33/scratchpad/pb/src/android/app/src/main/assets/www/widgets/basic.js
  function bindProcessLink(box, sortTarget) {
    if (!hasProcessesPage()) return;
    box.style.cursor = "pointer";
    box.addEventListener("click", () => {
      if (!hasProcessesPage()) return;
      haptic();
      gotoProcesses(sortTarget);
    });
  }
  W.clock = {
    bare: true,
    needs: ["tick", "state", "weather", "quotas", "work"],
    create(box, { o }) {
      const status = o.status !== false ? h("div", "status") : null;
      const hh = h("span", "hh", "--"), mm = h("span", "mm", "--"), ss = h("span", "sec"), ap = h("span", "ap");
      const date = o.date !== false ? h("div", "date") : null;
      const wx = o.weather !== false ? wxBlock() : null;
      box.append(status || "", h("div", "clock", hh, h("span", "colon", ":"), mm, ss, ap), date || "", wx || "");
      box.style.setProperty("--tf", (0.84 - (status ? 0.1 : 0) - (date ? 0.11 : 0) - (wx ? 0.2 : 0)).toFixed(2));
      return {
        // without the weather line the clock must not make the panel fetch the weather
        needs: wx ? W.clock.needs : W.clock.needs.filter((k) => k !== "weather"),
        update(kind) {
          var _a;
          if (kind === "tick") {
            const now = /* @__PURE__ */ new Date();
            const H = now.getHours(), h12 = hour12();
            hh.textContent = h12 ? String(H % 12 || 12) : pad(H);
            ap.textContent = h12 ? H < 12 ? "AM" : "PM" : "";
            mm.textContent = pad(now.getMinutes());
            ss.textContent = ((_a = cfg.display) == null ? void 0 : _a.showSeconds) === false ? "" : pad(now.getSeconds());
            if (date) date.textContent = now.toLocaleDateString(LOCALE, { weekday: "long", day: "numeric", month: "long" });
            if (status && now.getSeconds() % 30 === 0) renderStatus(status);
          } else if (kind === "weather") wx == null ? void 0 : wx.update();
          else if (status) renderStatus(status);
        }
      };
    }
  };
  W.weather = {
    needs: ["weather"],
    create(box) {
      const wx = wxBlock();
      box.append(wx);
      return { update: () => wx.update() };
    }
  };
  W.forecast = {
    needs: ["weather"],
    create(box, { o }) {
      const daily = o.mode === "daily";
      const row = h("div", "fc");
      box.append(h("div", "w-title", daily ? "7-day forecast" : "Next hours", h("span", "w-sub", "")), row);
      return {
        update() {
          var _a, _b, _c, _d, _e;
          const w = D.weather;
          if (!(w == null ? void 0 : w.hourly) || !(w == null ? void 0 : w.daily)) {
            row.replaceChildren(h("div", "empty", D.weather === null ? t("w.loading") : t("w.weatherUnavailable")));
            return;
          }
          box.querySelector(".w-sub").textContent = ((_a = cfg.weather) == null ? void 0 : _a.city) || "";
          const vertical = box.clientHeight > box.clientWidth * 0.9;
          const room = vertical ? box.clientHeight - 30 : box.clientWidth - 16;
          const n = Math.max(3, Math.min(daily ? 7 : 12, Math.floor(room / (vertical ? 30 : 50))));
          row.classList.toggle("vert", vertical);
          const cells = [];
          if (daily) {
            const d = w.daily;
            for (let i = 0; i < Math.min(n, d.time.length); i++) {
              const day = i === 0 ? t("time.today") : (/* @__PURE__ */ new Date(d.time[i] + "T12:00")).toLocaleDateString(LOCALE, { weekday: "short" });
              const rain = (_b = d.precipitation_probability_max) == null ? void 0 : _b[i];
              cells.push(h(
                "div",
                "fc-i",
                h("span", "fc-t", day),
                h("span", "fc-ic", wxIcon(d.weather_code[i])),
                h("span", "fc-v", Math.round(d.temperature_2m_max[i]) + "\xB0", h("small", null, " " + Math.round(d.temperature_2m_min[i]) + "\xB0")),
                h("span", "fc-r", rain >= 20 ? `\u{1F4A7}${rain}%` : "")
              ));
            }
          } else {
            const hr = w.hourly;
            let start = hr.time.indexOf((((_c = w.current) == null ? void 0 : _c.time) || "").slice(0, 13) + ":00");
            if (start < 0) start = 0;
            const step = n >= 10 ? 1 : 2;
            for (let k = 0; k < n; k++) {
              const i = start + k * step;
              if (i >= hr.time.length) break;
              const rain = (_d = hr.precipitation_probability) == null ? void 0 : _d[i];
              cells.push(h(
                "div",
                "fc-i",
                h("span", "fc-t", k === 0 ? "Now" : hr.time[i].slice(11, 13)),
                h("span", "fc-ic", wxIcon(hr.weather_code[i], (_e = hr.is_day) == null ? void 0 : _e[i])),
                h("span", "fc-v", Math.round(hr.temperature_2m[i]) + "\xB0"),
                h("span", "fc-r", rain >= 20 ? `\u{1F4A7}${rain}%` : "")
              ));
            }
          }
          row.replaceChildren(...cells);
        }
      };
    }
  };
  W.media = {
    needs: ["state", "fast"],
    create(box) {
      box.innerHTML = mediaHtml();
      const q = (s) => box.querySelector(s);
      const img = q(".art"), vol = q(".volr");
      const sourceIcon = q(".m-source-icon");
      const sourceIcons = {
        YouTube: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="1" y="4" width="22" height="16" rx="5" fill="#ff0033"/><path d="m10 8 6 4-6 4z" fill="#fff"/></svg>',
        "YouTube Music": '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#ff0033"/><circle cx="12" cy="12" r="6.5" fill="none" stroke="#fff" stroke-width="1.4"/><path d="m10 8.5 5.5 3.5-5.5 3.5z" fill="#fff"/></svg>',
        "Internet Radio": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.2 6.8 18.5 2a1 1 0 0 1 .7 1.9L10.8 7H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2.2zm1.8 5.2a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm6 1.5v1.8h4v-1.8h-4zm0 3.2v1.8h4v-1.8h-4z" fill="#38bdf8"/></svg>'
      };
      let artId = -1, volTimer = 0, volumeRelease = 0;
      img.addEventListener("load", () => {
        img.classList.add("on");
        setArtColor(averageColor(img));
      });
      img.addEventListener("error", () => img.classList.remove("on"));
      box.querySelectorAll("[data-media]").forEach((btn) => btn.addEventListener("click", () => __async(this, null, function* () {
        haptic();
        const action = btn.dataset.media;
        if (action === "playpause" && media) {
          media.playing = !media.playing;
          media.at = performance.now();
          box.classList.toggle("playing", media.playing);
        }
        try {
          const res = yield api("/media/" + action, "POST");
          if (res && typeof res === "object" && "media" in res) setMediaState(res.media);
          invalidateDeckState();
          emit("tick");
        } catch (_) {
        }
      })));
      q(".bar").addEventListener("click", (e) => __async(this, null, function* () {
        if (!media || !media.durMs || !media.canSeek) return;
        const r = e.currentTarget.getBoundingClientRect();
        const ms = Math.round((e.clientX - r.left) / r.width * media.durMs);
        haptic();
        media.posMs = ms;
        media.at = performance.now();
        try {
          yield api("/media/seek?ms=" + ms, "POST");
        } catch (_) {
        }
      }));
      const paintVol = (v) => {
        vol.style.setProperty("--p", v + "%");
        q(".vol-val").textContent = v;
      };
      const cancelVolumeDrag = () => {
        clearTimeout(volTimer);
        clearTimeout(volumeRelease);
        setVolDragging(vol, false);
      };
      vol.addEventListener("input", () => {
        clearTimeout(volumeRelease);
        setVolDragging(vol, true);
        paintVol(vol.value);
        clearTimeout(volTimer);
        volTimer = setTimeout(() => api("/volume?level=" + vol.value, "POST").catch(() => {
        }), 120);
      });
      vol.addEventListener("change", () => {
        clearTimeout(volumeRelease);
        volumeRelease = setTimeout(() => setVolDragging(vol, false), 600);
      });
      vol.addEventListener("pointercancel", cancelVolumeDrag);
      q(".mute").addEventListener("click", () => __async(this, null, function* () {
        var _a;
        haptic();
        if (!((_a = D.state) == null ? void 0 : _a.audio) || D.state.audio.canControl === false) return;
        try {
          const a = yield api("/volume?op=mute", "POST");
          D.state.audio = a;
          emit("state");
        } catch (_) {
        }
      }));
      return {
        update(kind) {
          var _a, _b;
          if (kind === "fast") {
            if (!media) return;
            if (media.durMs > 0) {
              const pos = Math.min(media.durMs, media.posMs + (media.playing ? performance.now() - media.at : 0));
              q(".fill").style.width = pos / media.durMs * 100 + "%";
              q(".m-pos").textContent = fmtTime(pos);
            } else if (media.app === "Internet Radio") {
              const pos = Math.max(0, (media.posMs || 0) + (media.playing ? performance.now() - media.at : 0));
              q(".fill").style.width = media.playing ? "100%" : "0";
              q(".m-pos").textContent = fmtTime(pos);
            }
            return;
          }
          const m = (_a = D.state) == null ? void 0 : _a.media, a = (_b = D.state) == null ? void 0 : _b.audio;
          vol.disabled = !a || a.canControl === false;
          box.classList.toggle("volume-unavailable", !a || a.canControl === false);
          q(".mute").disabled = !a || a.canControl === false;
          box.classList.toggle("muted-on", !!(a == null ? void 0 : a.muted));
          if (a) {
            if (!volDragging) {
              vol.value = a.volume;
              paintVol(a.volume);
            }
          } else q(".vol-val").textContent = "n/a";
          box.classList.toggle("idle", !m);
          if (!m) {
            box.classList.remove("playing");
            q(".m-app-name").textContent = "Media";
            sourceIcon.replaceChildren();
            q(".m-title").textContent = t("w.nothingPlaying");
            q(".m-artist").textContent = t("w.pressToResume");
            q(".fill").style.width = "0";
            q(".m-pos").textContent = q(".m-dur").textContent = "0:00";
            if (artId !== 0) {
              artId = 0;
              img.classList.remove("on");
              setArtColor(null);
            }
            return;
          }
          box.classList.toggle("playing", m.playing);
          q(".m-app-name").textContent = m.app || "Media";
          sourceIcon.innerHTML = sourceIcons[m.app] || "";
          q(".m-title").textContent = m.title || "Unknown track";
          q(".m-artist").textContent = [m.artist, m.album].filter(Boolean).join(" \xB7 ") || "\u2014";
          if (m.app === "Internet Radio" && !(m.durMs > 0)) {
            q(".fill").style.width = m.playing ? "100%" : "0";
            q(".m-pos").textContent = fmtTime(m.posMs || 0);
            q(".m-dur").textContent = m.playing ? "LIVE" : "0:00";
          } else {
            q(".m-dur").textContent = fmtTime(m.durMs);
          }
          if (m.artId !== artId) {
            artId = m.artId;
            if (m.artId) img.src = `${API}/art?id=${m.artId}`;
            else {
              img.classList.remove("on");
              setArtColor(null);
            }
          }
        },
        destroy: cancelVolumeDrag
      };
    }
  };
  W.stat = {
    needs: ["state"],
    create(box, { o }) {
      const m = METRICS[o.metric] || METRICS.cpu;
      const c = color(m.color);
      box.style.setProperty("--c", c);
      const canvas = h("canvas");
      const lbl = h("div", "t-label", m.label);
      const val = h("b", null, "\u2014"), unit = h("small"), sub = h("div", "t-sub", " ");
      box.append(canvas, lbl, h("div", "t-val", val, unit), sub);
      if (o.metric === "cpu" || o.metric === "ram") bindProcessLink(box, o.metric === "cpu" ? "cpu" : "mem");
      return {
        update() {
          var _a, _b;
          const s = D.state;
          if (!s) return;
          const [v, u] = metricText(m, s);
          val.textContent = v;
          unit.textContent = u;
          const pctVal = (_a = m.pct) == null ? void 0 : _a.call(m, s);
          lbl.textContent = pctVal != null && m.label === "RAM" ? `RAM (${Math.round(pctVal)}%)` : m.label;
          sub.textContent = ((_b = m.sub) == null ? void 0 : _b.call(m, s)) || " ";
          chart(canvas, [{ data: hist[m.hist || o.metric] || hist.cpu, color: c, max: m.max(s) }]);
        }
      };
    }
  };
  W.gauge = {
    needs: ["state"],
    create(box, { o }) {
      const m = METRICS[o.metric] || METRICS.cpu;
      box.style.setProperty("--q", color(m.color));
      const dial = h("div", "g-dial"), pct = h("div", "g-val"), sub = h("div", "g-sub");
      box.append(dial, h("div", "g-label", m.label), sub);
      dial.append(pct);
      if (o.metric === "cpu" || o.metric === "ram") bindProcessLink(box, o.metric === "cpu" ? "cpu" : "mem");
      let svg = null;
      return {
        update() {
          var _a;
          const s = D.state;
          if (!s) return;
          const raw = m.pct ? m.pct(s) : m.val(s);
          const p = raw == null ? 0 : raw / (m.pct ? 100 : m.max(s)) * 100;
          const warn = m.hot ? raw > m.hot[1] ? "#ef4444" : raw > m.hot[0] ? "#f59e0b" : "" : p >= 95 ? "#ef4444" : p >= 85 ? "#f59e0b" : "";
          dial.style.setProperty("--qc", warn || "var(--q)");
          if (svg) svg.remove();
          dial.insertAdjacentHTML("afterbegin", ringSvg(p));
          svg = dial.firstElementChild;
          const [v, u] = metricText(m, s);
          pct.replaceChildren(v, h("small", null, u));
          sub.textContent = ((_a = m.sub) == null ? void 0 : _a.call(m, s)) || "";
        }
      };
    }
  };
  W.chart = {
    needs: ["state"],
    create(box, { o }) {
      const keys = (Array.isArray(o.metrics) && o.metrics.length ? o.metrics : ["cpu"]).filter((k) => Object.prototype.hasOwnProperty.call(METRICS, k));
      if (!keys.length) keys.push("cpu");
      const single = keys.length === 1 ? METRICS[keys[0]] : null;
      const isNet = keys.every((k) => k === "down" || k === "up");
      const label = single ? single.name : isNet ? "Network" : keys.map((k) => METRICS[k].name).join(" \xB7 ");
      box.style.setProperty("--c", color((single || METRICS[keys[0]]).color));
      const head = h("div", "s-head", h("span", "s-label", label), h("span", "s-name", ""));
      const main = h("div", "s-main");
      const canvas = h("canvas");
      box.append(head, main, canvas);
      if (keys.includes("cpu") || keys.includes("ram")) bindProcessLink(box, keys.includes("cpu") ? "cpu" : "mem");
      return {
        update() {
          var _a, _b;
          const s = D.state;
          if (!s) return;
          if (single) {
            const [v, u] = metricText(single, s);
            main.replaceChildren(h("b", null, v), h("small", null, u), h("span", "chips", ((_a = single.sub) == null ? void 0 : _a.call(single, s)) ? h("span", "chip", single.sub(s)) : ""));
            head.lastChild.textContent = ((_b = single.title) == null ? void 0 : _b.call(single, s)) || "";
          } else {
            main.replaceChildren(...keys.map((k) => {
              const mm = METRICS[k];
              const [v, u] = metricText(mm, s);
              const e = h("span", "multi", k === "down" ? "\u2193 " : k === "up" ? "\u2191 " : mm.label + " ", h("b", null, v + " " + u));
              e.style.color = color(mm.color);
              return e;
            }));
            head.lastChild.textContent = isNet && s.ping ? `Ping ${s.ping.ms != null ? Math.round(s.ping.ms) + " ms" : "\u2014"} \xB7 loss ${s.ping.lossPct}%` : "";
          }
          chart(canvas, keys.map((k) => ({ data: hist[METRICS[k].hist || k], color: color(METRICS[k].color), max: METRICS[k].max(s) })), { grid: true });
        }
      };
    }
  };
  W.meters = {
    needs: ["state"],
    create(box) {
      box.style.setProperty("--c", cssVar("--ram"));
      const up = h("span", "s-name");
      const list = h("div", "meters");
      box.append(h("div", "s-head", h("span", "s-label", t("w.memory")), up), list);
      bindProcessLink(box, "mem");
      const meter2 = (name, txt, pct, c) => {
        const e = h("div", "meter", h("div", "m-row", h("span", null, name), h("span", null, txt)), h("div", "track", h("i")));
        e.querySelector("i").style.width = Math.min(100, pct) + "%";
        if (c) e.style.setProperty("--c", c);
        return e;
      };
      return {
        update() {
          var _a;
          const pc = (_a = D.state) == null ? void 0 : _a.pc;
          if (!pc) return;
          const s = pc.uptimeSec, d = Math.floor(s / 86400), hr = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60);
          up.textContent = "Up " + (d ? `${d} d ${hr} h` : hr ? `${hr} h ${m} min` : `${m} min`);
          const rows = [meter2("RAM", `${r1(pc.ramUsedGb)} / ${Math.round(pc.ramTotalGb)} GB`, pc.ramUsedGb / pc.ramTotalGb * 100)];
          const gpus = gpusOf(D.state);
          for (const g of gpus) {
            const m2 = gpuMem(g);
            if (m2) rows.push(meter2(
              gpus.length > 1 ? `${m2.label === "VRAM" ? "VRAM" : "GPU"} \xB7 ${shortGpu(g.name)}` : m2.label === "VRAM" ? "VRAM" : "GPU MEMORY",
              `${r1(m2.used)} / ${Math.round(m2.total)} GB`,
              m2.used / m2.total * 100,
              cssVar("--gpu")
            ));
          }
          const disks = h("div", "disks", ...(pc.disks || []).map((dk) => meter2(dk.name === "/" ? "DISK" : dk.name, Math.round(dk.usedGb / dk.totalGb * 100) + "%", dk.usedGb / dk.totalGb * 100, "#94a3b8")));
          list.replaceChildren(...rows, disks);
        }
      };
    }
  };
  W.quotas = {
    needs: ["quotas", "tick"],
    /**
     * Creates the AI Quotas widget instance with optional paged provider rotation.
     */
    create(box, { o }) {
      const tokens = (n) => n == null ? "\u2014" : n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : n >= 1e3 ? (n / 1e3).toFixed(1) + "k" : String(n);
      const grid = h("div", "q-grid", h("div", "empty", "Quota data arrives once the computer is connected."));
      box.append(grid);
      let last = 0;
      let offset = 0;
      let lastRotate = Date.now();
      const isRotateEnabled = () => {
        var _a, _b;
        if (o.rotate !== void 0 && o.rotate !== null) return !!o.rotate;
        if (((_a = cfg.codexBar) == null ? void 0 : _a.rotate) !== void 0 && ((_b = cfg.codexBar) == null ? void 0 : _b.rotate) !== null) return !!cfg.codexBar.rotate;
        return true;
      };
      const getPageSize = () => {
        var _a, _b;
        if (o.pageSize !== void 0 && o.pageSize !== null && o.pageSize !== "") {
          const n = Number(o.pageSize);
          return Number.isFinite(n) ? Math.max(0, Math.min(6, Math.floor(n))) : 2;
        }
        return (_b = (_a = cfg.codexBar) == null ? void 0 : _a.pageSize) != null ? _b : 2;
      };
      const getRotateInterval = () => {
        var _a, _b;
        if (!isRotateEnabled()) return 0;
        if (o.rotateInterval !== void 0 && o.rotateInterval !== null && o.rotateInterval !== "") {
          const n = Number(o.rotateInterval);
          return Number.isFinite(n) ? Math.max(2, Math.min(300, n)) : 8;
        }
        return (_b = (_a = cfg.codexBar) == null ? void 0 : _a.rotateInterval) != null ? _b : 8;
      };
      const getProviders = () => {
        var _a;
        if (Array.isArray(o.providers)) return o.providers;
        if (Array.isArray((_a = cfg.codexBar) == null ? void 0 : _a.providers)) return cfg.codexBar.providers;
        return ["claude", "codex", "antigravity"];
      };
      const isOverviewEnabled = () => o.showOverview === true;
      const getItems = () => {
        var _a;
        const want = getProviders();
        const items = quotaProviders().filter((p) => want.includes(p.id));
        if (isOverviewEnabled() && ((_a = D.quotas) == null ? void 0 : _a.overview)) {
          return [{ id: "__overview__", isOverview: true, overview: D.quotas.overview }, ...items];
        }
        return items;
      };
      const fmtCurrency = (amount, code = "USD") => {
        const n = Number(amount || 0);
        const cur = (code || "USD").toUpperCase();
        try {
          return new Intl.NumberFormat(LOCALE, { style: "currency", currency: cur }).format(n);
        } catch (_) {
          return `${cur === "USD" ? "$" : cur + " "}${n.toFixed(2)}`;
        }
      };
      const renderOverviewCard = (ov, flexVal) => {
        var _a;
        const card = h("div", "q-card q-overview-card");
        card.style.setProperty("--q", "#f97316");
        card.style.flex = flexVal;
        const days = ov.windowDays || 30;
        const age = ov.updatedAt ? Math.max(0, Date.now() - ov.updatedAt) : null;
        const updStr = age != null ? `checked ${age < 6e4 ? "just now" : fmtDur(age) + " ago"}` : "";
        card.appendChild(h(
          "div",
          "q-head",
          h("span", "q-logo", "\u{1F4CA}"),
          h("span", "q-name", "Overview"),
          h("span", "q-plan", `${days}-day spend`),
          updStr ? h("span", "q-upd", updStr) : null
        ));
        const summary = h(
          "div",
          "q-ov-hero",
          h("div", "q-ov-stat", h("span", "q-ov-lbl", "Estimated spend"), h("strong", "q-ov-val", fmtCurrency(ov.totalCost, ov.currencyCode))),
          h("div", "q-ov-stat", h("span", "q-ov-lbl", "Recorded tokens"), h("strong", "q-ov-val", tokens(ov.totalTokens || 0)))
        );
        card.appendChild(summary);
        const details = h("div", "q-details q-ov-details");
        for (const s of (ov.subscriptions || []).slice(0, 3)) {
          details.appendChild(h(
            "div",
            "q-detail",
            h("span", null, s.name),
            h("strong", null, `${tokens(s.tokens)} \xB7 ${fmtCurrency(s.cost, s.currencyCode || ov.currencyCode)}`)
          ));
        }
        for (const m of (ov.topModels || []).slice(0, 2)) {
          details.appendChild(h(
            "div",
            "q-detail q-breakdown",
            h("span", null, m.modelName || m.name),
            h("strong", null, fmtCurrency(m.cost, m.currencyCode || ov.currencyCode))
          ));
        }
        if (details.childNodes.length) card.appendChild(details);
        const count = (_a = ov.providerCount) != null ? _a : (ov.subscriptions || []).length;
        card.appendChild(h("div", "q-foot", h("span", null, `${count} ${count === 1 ? "provider" : "providers"}`), h("span")));
        return card;
      };
      const render = () => {
        var _a;
        if (!D.quotas) return;
        const want = getProviders();
        const list = getItems();
        grid.replaceChildren();
        if (!list.length) {
          grid.appendChild(h("div", "empty", want.length ? "Quota data is unavailable for the selected providers" : "No quota providers enabled"));
          return;
        }
        const ps = getPageSize();
        const needsPaging = isRotateEnabled() && ps > 0 && list.length > ps;
        if (offset >= list.length) offset = 0;
        let visible = list;
        if (needsPaging) {
          visible = [];
          for (let i = 0; i < ps; i++) {
            visible.push(list[(offset + i) % list.length]);
          }
        }
        for (const p of visible) {
          if (p.isOverview) {
            grid.appendChild(renderOverviewCard(p.overview, needsPaging && ps === 2 ? "1 1 0" : "1.5"));
            continue;
          }
          const st = Q_STYLE[p.id] || { color: "#94a3b8", logo: "\u25CF" };
          const card = h("div", "q-card" + (p.limits.length >= 4 ? " q-card-compact" : ""));
          card.style.setProperty("--q", st.color);
          card.style.flex = needsPaging && ps === 2 ? "1 1 0" : String(Math.max(1, p.limits.length) + 0.3);
          card.appendChild(h(
            "div",
            "q-head",
            h("span", "q-logo", st.logo),
            h("span", "q-name", p.name),
            h("span", "q-plan", p.plan),
            p.updatedAt ? h("span", "q-upd", fmtDur(Date.now() - p.updatedAt) + " ago") : null
          ));
          const compact = p.limits.length >= 4;
          const rings = h("div", "q-rings" + (compact ? " q-rings-grid" : ""));
          for (const l of p.limits) {
            const pace = paceInfo(l);
            const dial = h("div", "q-dial");
            if (compact) {
              dial.style.width = "86px";
              dial.style.height = "86px";
            }
            if (l.percent >= 95 || l.severity === "critical") dial.style.setProperty("--qc", "#ef4444");
            else if (l.percent >= 80 || l.severity === "warning") dial.style.setProperty("--qc", "#f59e0b");
            dial.innerHTML = ringSvg(l.percent, pace == null ? void 0 : pace.elapsed);
            const pctEl = h("div", "q-pct", String(Math.round(l.percent)), h("small", null, "%"));
            if (compact) pctEl.style.fontSize = "calc(22px * var(--widget-font-scale, 1))";
            dial.appendChild(pctEl);
            rings.appendChild(h(
              "div",
              "q-ring",
              dial,
              h("div", "q-label", l.label),
              p.id === "codex" ? h("div", "q-left", `${Math.max(0, Math.round(100 - l.percent))}% left`) : null,
              h("div", "q-reset", fmtReset(l.resetsAt)),
              pace ? h("div", "q-pace " + pace.cls, pace.text) : null
            ));
          }
          if (!p.limits.length) rings.appendChild(h("div", "q-reset", "No data"));
          card.append(rings);
          if (p.id === "codex" && p.codex) {
            const c = p.codex;
            const details = h("div", "q-details");
            if (c.model) details.append(h("div", "q-detail", h("span", null, "Latest local session"), h("strong", null, c.model + (c.effort ? ` \xB7 ${c.effort}` : ""))));
            if (c.totalTokens != null) details.append(h("div", "q-detail", h("span", null, "Session tokens"), h("strong", null, tokens(c.totalTokens))));
            if (c.totalInput != null || c.totalOutput != null) details.append(h("div", "q-detail q-breakdown", `In ${tokens(c.totalInput)} \xB7 Out ${tokens(c.totalOutput)} \xB7 Cached ${tokens(c.totalCached)} \xB7 Reasoning ${tokens(c.totalReasoning)}`));
            if (c.lastInput != null && c.contextWindow) details.append(h("div", "q-detail q-breakdown", `Last input ${tokens(c.lastInput)} / ${tokens(c.contextWindow)} context window`));
            if (details.childNodes.length) card.append(details);
          }
          card.append(h("div", "q-foot", h("span", ((_a = p.extra) == null ? void 0 : _a.startsWith("Limit reached")) ? "q-alert" : null, p.extra || ""), p.error ? h("span", "q-err", p.error) : h("span")));
          grid.appendChild(card);
        }
        if (needsPaging) {
          const dots = h("div", "q-dots");
          for (let i = 0; i < list.length; i++) {
            const dot = h("span", "q-dot" + (i === offset ? " active" : ""));
            dot.onclick = (e) => {
              e.stopPropagation();
              offset = i;
              lastRotate = Date.now();
              render();
              haptic();
            };
            dots.appendChild(dot);
          }
          grid.appendChild(dots);
        }
      };
      grid.onclick = () => {
        const ps = getPageSize();
        const list = getItems();
        if (ps > 0 && list.length > ps) {
          offset = (offset + 1) % list.length;
          lastRotate = Date.now();
          render();
          haptic();
        }
      };
      const isStackPaused = () => {
        var _a;
        return ((_a = box.closest(".w-stack")) == null ? void 0 : _a.dataset.stackPaused) === "1";
      };
      return {
        /**
         * Updates quota display and advances paged provider rotation on ticks.
         */
        update(kind) {
          if (kind === "tick") {
            const sec = getRotateInterval();
            if (isStackPaused()) {
              lastRotate = Date.now();
            } else if (sec > 0 && Date.now() - lastRotate >= sec * 1e3) {
              const ps = getPageSize();
              const list = getItems();
              if (ps > 0 && list.length > ps) {
                offset = (offset + 1) % list.length;
                lastRotate = Date.now();
                render();
              }
            }
            if (Date.now() - last > 3e4) {
              last = Date.now();
              render();
            }
            return;
          }
          last = Date.now();
          render();
        }
      };
    }
  };
  W.codexbar = W.quotas;
  W.sessions = {
    needs: ["work", "tick"],
    create(box) {
      const sum = h("span", "w-sum");
      const list = h("div", "s-list", h("div", "empty", t("sess.waitingData")));
      box.append(h("div", "w-head", h("span", "s-label", t("w.sessions")), sum), list);
      box.style.setProperty("--c", "#d97757");
      const tokens = (n) => n == null ? "\u2014" : n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : n >= 1e3 ? (n / 1e3).toFixed(1) + "k" : String(n);
      const statusText = (s) => s.status === "busy" ? t("sess.working") : s.status === "waiting" ? t("sess.waiting") : s.status === "shell" ? t("sess.shell") : s.outcome === "completed" ? t("sess.completed") : s.outcome === "aborted" ? t("sess.aborted") : t("sess.idle");
      const ageText = (since) => Date.now() - since < 6e4 ? "just now" : shortDur(Date.now() - since) + " ago";
      const openDetails = (s) => {
        haptic();
        const backdrop = h("div", "session-backdrop");
        const panel = h("div", "session-panel");
        panel.setAttribute("role", "dialog");
        panel.setAttribute("aria-modal", "true");
        const title = h("h2", null, s.project || s.name);
        const close = h("button", "session-close", "\u2715");
        close.setAttribute("aria-label", "Close session details");
        const onKey = (e) => {
          if (e.key === "Escape") dismiss2();
        };
        const dismiss2 = () => {
          backdrop.remove();
          document.removeEventListener("keydown", onKey);
        };
        close.addEventListener("click", dismiss2);
        backdrop.addEventListener("click", (e) => {
          if (e.target === backdrop) dismiss2();
        });
        panel.append(h("div", "session-panel-head", h("span", null, s.tool === "codex" ? "\u25CE Codex" : "\u2733\uFE0E Claude Code"), close), title);
        const rows = [
          ["Status", statusText(s)],
          ["Started", s.startedAt ? ageText(s.startedAt) : null],
          ["Last activity", s.since ? ageText(s.since) : null],
          ["Current turn", s.status === "busy" && s.turnStartedAt ? shortDur(Date.now() - s.turnStartedAt) : null],
          ["Model", s.model],
          ["Reasoning", s.effort],
          ["Session tokens", s.totalTokens != null ? tokens(s.totalTokens) : null],
          ["Input / output", s.inputTokens != null || s.outputTokens != null ? `${tokens(s.inputTokens)} / ${tokens(s.outputTokens)}` : null],
          ["Cached input", s.cachedInputTokens != null ? tokens(s.cachedInputTokens) : null],
          ["Reasoning output", s.reasoningTokens != null ? tokens(s.reasoningTokens) : null],
          ["Last input / context window", s.lastInputTokens != null && s.contextWindow ? `${tokens(s.lastInputTokens)} / ${tokens(s.contextWindow)}` : null],
          ["Recent tool", s.lastTool]
        ];
        for (const [label, value] of rows) if (value != null) panel.append(h("div", "session-detail-row", h("span", null, label), h("strong", null, value)));
        if (s.tool === "codex") panel.append(h("p", "session-note", "Token totals are for this local session, not your account allowance."));
        backdrop.append(panel);
        document.body.append(backdrop);
        close.focus();
        document.addEventListener("keydown", onKey);
      };
      return {
        update() {
          var _a;
          const sessions2 = (_a = D.work) == null ? void 0 : _a.sessions;
          if (!sessions2) return;
          const counts = { waiting: 0, busy: 0, shell: 0, idle: 0 };
          sessions2.forEach((s) => counts[s.status] = (counts[s.status] || 0) + 1);
          sum.textContent = [
            counts.busy + counts.shell ? `${counts.busy + counts.shell} working` : "",
            counts.waiting ? `${counts.waiting} waiting` : "",
            counts.idle ? `${counts.idle} idle` : ""
          ].filter(Boolean).join(" \xB7 ") || t("w.noOpenSessions");
          const sorted = [...sessions2].sort((a, b) => {
            var _a2, _b;
            return ((_a2 = S_ORDER[a.status]) != null ? _a2 : 9) - ((_b = S_ORDER[b.status]) != null ? _b : 9) || b.since - a.since;
          });
          const rows = sorted.length ? sorted.map((s) => {
            const row = h(
              "button",
              "sess " + s.status,
              h("span", "st"),
              h("span", "tl " + s.tool, s.tool === "claude" ? "\u2733\uFE0E" : "\u25CE"),
              h("span", "sess-main", h("span", "nm", s.project || s.name), h("span", "sess-meta", [s.model, s.effort].filter(Boolean).join(" \xB7 ") || statusText(s))),
              h("span", "ds", shortDur(Date.now() - s.since))
            );
            row.type = "button";
            row.addEventListener("click", () => openDetails(s));
            return row;
          }) : [h("div", "empty", t("w.noAiSessions"))];
          list.replaceChildren(...rows);
        }
      };
    }
  };
  W.github = {
    needs: ["work"],
    create(box) {
      box.style.setProperty("--c", "#c9d1d9");
      const user = h("span", "w-sum"), bell = h("span", "gh-bell");
      const rc = h("b"), mc = h("b"), rev = h("div", "gh-list"), mine = h("div", "gh-list"), err = h("div", "gh-err", "Waiting for GitHub data\u2026");
      box.append(
        h("div", "w-head", h("span", "s-label", "GitHub"), user, bell),
        h("div", "gh-sec", h("span", null, "Review requests"), rc),
        rev,
        h("div", "gh-sec", h("span", null, "My pull requests"), mc),
        mine,
        err
      );
      return {
        update() {
          var _a;
          const g = (_a = D.work) == null ? void 0 : _a.github;
          if (!g) return;
          const rows = Math.max(1, Math.floor((box.clientHeight - 90) / 25));
          user.textContent = g.user ? "@" + g.user : "";
          bell.textContent = `\u{1F514} ${g.notifications >= 50 ? "50+" : g.notifications}`;
          rc.textContent = g.reviewRequests.length;
          mc.textContent = g.myPrs.length;
          const nRev = Math.min(g.reviewRequests.length || 1, Math.max(1, Math.floor(rows / 2)));
          rev.replaceChildren(...g.reviewRequests.length ? g.reviewRequests.slice(0, nRev).map((p) => prRow(p, false)) : [h("div", "gh-pr", t("w.noReviews"))]);
          mine.replaceChildren(...g.myPrs.length ? g.myPrs.slice(0, Math.max(1, rows - nRev)).map((p) => prRow(p, true)) : [h("div", "gh-pr", t("w.noPrs"))]);
          err.textContent = g.error ? "GitHub: " + g.error : "";
        }
      };
    }
  };
  W.processes = {
    needs: ["procs", "state"],
    create(box, { o }) {
      const canKill = o.allowKill !== false;
      let sort = currentProcessesSort();
      const sum = h("span", "p-sum");
      const seg = h("div", "seg", h("button", sort === "cpu" ? "on" : null, "CPU"), h("button", sort === "mem" ? "on" : null, "RAM"));
      const grid = h("div", "p-grid", h("div", "empty", t("w.procsWait")));
      box.style.setProperty("--c", "#f472b6");
      box.append(h("div", "p-head", h("span", "s-label", t("w.processes")), sum, seg), grid);
      const els = /* @__PURE__ */ new Map();
      const rowEl = (g) => {
        let e = els.get(g.name);
        if (e) return e;
        e = h("div", "proc");
        e.innerHTML = '<div class="p-ico"></div><div class="p-info"><div class="p-title"><span class="p-t"></span><span class="p-count"></span><span class="p-lock"></span></div><div class="p-bar"><i></i></div></div><div class="p-nums"><b></b><small></small></div>';
        fillIcon(e.querySelector(".p-ico"), g);
        e.addEventListener("click", () => {
          haptic();
          openSheet(e._g, canKill);
        });
        els.set(g.name, e);
        return e;
      };
      const render = () => {
        var _a, _b;
        const data = D.procs;
        if (!data) return;
        if (!data.groups.length) {
          sum.textContent = "";
          grid.replaceChildren(h("div", "empty", t("w.measuring")));
          return;
        }
        const cols = box.clientWidth > 460 ? 2 : 1;
        const rows = Math.max(1, Math.floor((box.clientHeight - 46) / 40));
        grid.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
        grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
        const list = [...data.groups].sort((a, b) => sort === "cpu" ? b.cpu - a.cpu || b.memMb - a.memMb : b.memMb - a.memMb).slice(0, cols * rows);
        const max = Math.max(0.1, ...list.map((g) => sort === "cpu" ? g.cpu : g.memMb));
        const pc = (_a = D.state) == null ? void 0 : _a.pc;
        const cpuPct = pc && pc.cpu != null ? Math.round(pc.cpu) : null;
        const ramPct = pc && pc.ramTotalGb ? Math.round(pc.ramUsedGb / pc.ramTotalGb * 100) : null;
        const ramStr = ramPct != null && pc.ramUsedGb != null && pc.ramTotalGb != null ? `Total RAM ${ramPct}% (${Math.round(pc.ramUsedGb)}/${Math.round(pc.ramTotalGb)} GB) \xB7 ` : ramPct != null ? `Total RAM ${ramPct}% \xB7 ` : "";
        const loadPart = sort === "cpu" ? cpuPct != null ? `Total CPU ${cpuPct}% \xB7 ` : "" : ramStr;
        sum.textContent = box.clientWidth > 380 ? loadPart + t("w.procsSummary", { n: data.total, apps: (_b = data.groupCount) != null ? _b : data.groups.length }) : loadPart + t("w.procsSummaryShort", { n: data.total });
        if (grid.querySelector(".empty")) grid.replaceChildren();
        const keep = new Set(list.map((g) => g.name));
        for (const [n, e] of els) if (!keep.has(n)) {
          e.remove();
          els.delete(n);
        }
        for (const g of list) {
          const e = rowEl(g);
          e._g = g;
          e.querySelector(".p-t").textContent = g.title;
          e.querySelector(".p-count").textContent = g.count > 1 ? "\xD7" + g.count : "";
          e.querySelector(".p-lock").textContent = g.locked ? "\u{1F512}" : "";
          e.querySelector(".p-bar i").style.width = (sort === "cpu" ? g.cpu : g.memMb) / max * 100 + "%";
          e.querySelector(".p-nums b").textContent = sort === "cpu" ? g.cpu.toFixed(1) + "%" : fmtMem(g.memMb);
          e.querySelector(".p-nums small").textContent = sort === "cpu" ? fmtMem(g.memMb) : g.cpu.toFixed(1) + "%";
          grid.appendChild(e);
        }
      };
      const setSort = (s) => {
        sort = s === "mem" ? "mem" : "cpu";
        [...seg.children].forEach((x, i) => x.classList.toggle("on", (i === 0 ? "cpu" : "mem") === sort));
        render();
      };
      registerProcessesSorter(setSort);
      [...seg.children].forEach((b, i) => b.addEventListener("click", () => {
        haptic();
        setSort(i === 0 ? "cpu" : "mem");
      }));
      return { update: render };
    }
  };
  function applyToggles(root) {
    var _a;
    const t2 = ((_a = D.state) == null ? void 0 : _a.toggles) || {};
    root.querySelectorAll(".key.toggle").forEach((b) => b.classList.toggle("on", t2[b.dataset.id] === true));
  }
  W.shortcuts = {
    needs: ["state"],
    create(box, { o }) {
      const all = cfg.shortcuts || [];
      const ids = Array.isArray(o.ids) && o.ids.length ? o.ids : null;
      const list = ids ? ids.map((id) => all.find((s) => s.id === id)).filter(Boolean) : all;
      if (!list.length) {
        box.append(h("div", "empty", all.length ? t("w.shortcutsMissing") : t("w.shortcutsWait")));
        return {};
      }
      const cols = Math.min(8, Math.max(1, o.columns || 4));
      const grid = h("div", "deck-grid", ...list.map(keyButton));
      grid.style.gridTemplateColumns = `repeat(${Math.min(cols, list.length)}, 1fr)`;
      grid.style.gridTemplateRows = `repeat(${Math.ceil(list.length / cols)}, 1fr)`;
      box.append(grid);
      return { update: () => applyToggles(box) };
    }
  };
  W.button = {
    bare: true,
    needs: ["state"],
    create(box, { o }) {
      const s = (cfg.shortcuts || []).find((x) => x.id === o.id) || (cfg.shortcuts || [])[0];
      box.append(s ? keyButton(s) : h("div", "empty", t("w.pickShortcut")));
      return { update: () => applyToggles(box) };
    }
  };
  W.worldclock = {
    needs: ["tick"],
    create(box, { o }) {
      const zones = (Array.isArray(o.zones) && o.zones.length ? o.zones : ["Tallinn=Europe/Tallinn", "Istanbul=Europe/Istanbul", "London=Europe/London", "New York=America/New_York", "Tokyo=Asia/Tokyo"]).map((z) => {
        const i = z.indexOf("=");
        return i > 0 ? [z.slice(0, i).trim(), z.slice(i + 1).trim()] : [z.split("/").pop().replace(/_/g, " "), z.trim()];
      });
      const items = zones.map(([name, tz]) => {
        let fmt = null;
        try {
          fmt = new Intl.DateTimeFormat("en-GB", { timeZone: tz, year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
        } catch (_) {
        }
        const t2 = h("div", "wc-t", fmt ? "--:--" : "??"), s = h("div", "wc-s", fmt ? "" : "unknown zone");
        return { fmt, t: t2, s, el: h("div", "wc", h("div", "wc-n", name), t2, s) };
      });
      const row = h("div", "wc-row", items.map((i) => i.el));
      box.append(row);
      let shown = -1;
      return {
        update() {
          const minute = Math.floor(Date.now() / 6e4);
          if (minute === shown) return;
          shown = minute;
          const now = /* @__PURE__ */ new Date();
          const localUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes());
          row.classList.toggle("vert", box.clientHeight > box.clientWidth * 1.1);
          row.classList.toggle("h12", hour12());
          for (const it of items) {
            if (!it.fmt) continue;
            const p = Object.fromEntries(it.fmt.formatToParts(now).map((x) => [x.type, x.value]));
            const [hm, ap] = fmtClock(+p.hour % 24, +p.minute).split(" ");
            it.t.replaceChildren(hm, ap ? h("span", "wc-ap", " " + ap) : "");
            const zoneUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute);
            const diffH = Math.round((zoneUtc - localUtc) / 36e4) / 10;
            const dayDiff = Math.round((Date.UTC(+p.year, +p.month - 1, +p.day) - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / 864e5);
            const day = dayDiff > 0 ? t("time.tomorrow") : dayDiff < 0 ? t("time.yesterday") : t("time.today");
            it.s.textContent = diffH === 0 ? day : `${day}, ${diffH > 0 ? "+" : "\u2212"}${Math.abs(diffH)}h`;
          }
        }
      };
    }
  };
  W.calendar = {
    needs: ["tick"],
    create(box) {
      let shown = "";
      return {
        update() {
          const now = /* @__PURE__ */ new Date();
          const key = now.toDateString();
          if (key === shown) return;
          shown = key;
          const y = now.getFullYear(), m = now.getMonth();
          const first = new Date(y, m, 1), days = new Date(y, m + 1, 0).getDate();
          const lead = (first.getDay() + 6) % 7;
          const cells = ["M", "T", "W", "T", "F", "S", "S"].map((d, i) => h("span", "cal-h" + (i > 4 ? " we" : ""), d));
          const prevDays = new Date(y, m, 0).getDate();
          for (let i = 0; i < lead; i++) cells.push(h("span", "cal-d out", prevDays - lead + 1 + i));
          for (let d = 1; d <= days; d++) {
            const wd = (lead + d - 1) % 7;
            cells.push(h("span", "cal-d" + (d === now.getDate() ? " today" : "") + (wd > 4 ? " we" : ""), d));
          }
          const total = Math.ceil(cells.length / 7) * 7;
          for (let d = 1; cells.length < total; d++) cells.push(h("span", "cal-d out", d));
          const grid = h("div", "cal", cells);
          grid.style.gridTemplateRows = `auto repeat(${total / 7 - 1}, 1fr)`;
          box.replaceChildren(h(
            "div",
            "w-title",
            now.toLocaleDateString(LOCALE, { month: "long", year: "numeric" }),
            h("span", "w-sub", "Week " + isoWeek(now))
          ), grid);
        }
      };
    }
  };
  function isoWeek(d) {
    const t2 = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    t2.setUTCDate(t2.getUTCDate() + 4 - (t2.getUTCDay() || 7));
    return Math.ceil(((t2 - Date.UTC(t2.getUTCFullYear(), 0, 1)) / 864e5 + 1) / 7);
  }
  function parsePomodoro(text) {
    const kindOf = (k) => /^l/i.test(k) ? "long" : /^(b|s)/i.test(k) ? "break" : "focus";
    const KIND = "(focus|work|f|short\\s*break|break|b|long\\s*break|long|l)";
    const re = new RegExp(`^(?:${KIND}\\s*(\\d{1,3})\\s*(?:m|min|minutes?)?|(\\d{1,3})\\s*(?:m|min|minutes?)?\\s*${KIND})$`, "i");
    const steps = [];
    for (const raw of String(text || "").split(/[,;\n]+/)) {
      const part = raw.trim();
      if (!part) continue;
      const m = part.match(re);
      const min = m ? +(m[2] || m[3]) : 0;
      if (!m || min < 1 || min > 600) return { steps: null, bad: part };
      steps.push({ kind: kindOf(m[1] || m[4]), ms: min * 6e4 });
      if (steps.length > 48) return { steps: null, bad: "more than 48 steps" };
    }
    return { steps: steps.length ? steps : null, bad: null };
  }
  W.pomodoro = {
    needs: ["tick"],
    always: true,
    // the alarm goes off on whatever page is showing
    create(box, { o, page, w }) {
      const key = `pomo:${page.id}/${w.id}`;
      const minutes = (v, d, max) => Math.min(max, Math.max(1, +v || d)) * 6e4;
      const focus = { kind: "focus", ms: minutes(o.focus, 25, 180) }, brk = { kind: "break", ms: minutes(o.break, 5, 60) };
      const long = { kind: "long", ms: minutes(o.longBreak, 15, 120) };
      const every2 = Math.min(12, Math.max(0, Math.floor(+o.longEvery || 0)));
      const rounds = Math.min(99, Math.max(0, Math.floor(+o.rounds || 0)));
      const custom = parsePomodoro(o.sequence);
      let plan = custom.steps;
      if (!plan) {
        plan = [];
        if (!every2) plan.push(focus, brk);
        else for (let i = 0; i < every2; i++) plan.push(focus, i === every2 - 1 ? long : brk);
      }
      const sig = plan.map((s) => `${s.kind[0]}${s.ms / 6e4}`).join(" ") + `/${rounds}`;
      const focusTotal = plan.filter((s) => s.kind === "focus").length;
      const today = (/* @__PURE__ */ new Date()).toDateString();
      let st = store.get(key, null);
      if (!st || typeof st !== "object") st = { phase: "focus", endsAt: null, left: plan[0].ms, count: 0, day: today };
      if (st.sig === void 0) {
        st.step = st.phase === "break" && plan.length > 1 ? 1 : 0;
        st.round = 0;
        st.sig = sig;
      } else if (st.sig !== sig) {
        Object.assign(st, { step: 0, round: 0, endsAt: null, left: plan[0].ms, sig });
      }
      if (!(st.step >= 0 && st.step < plan.length)) st.step = 0;
      if (st.day !== today) {
        st.count = 0;
        st.day = today;
      }
      const save = () => {
        st.phase = plan[st.step].kind;
        store.set(key, st);
      };
      save();
      const dial = h("div", "g-dial"), time = h("div", "g-val"), phase = h("div", "g-label"), count = h("div", "g-sub");
      const play = h("button", "pb main", "\u25B6"), reset = h("button", "pb", "\u21BA"), skip = h("button", "pb", "\u23ED");
      dial.append(time);
      box.append(dial, phase, count, h("div", "pomo-btns", reset, play, skip));
      let svg = null;
      const total = () => plan[st.step].ms;
      const remaining = () => st.endsAt ? Math.max(0, st.endsAt - Date.now()) : st.left;
      const advance = (manual) => {
        if (plan[st.step].kind === "focus" && !manual) st.count++;
        st.step++;
        if (st.step >= plan.length) {
          st.step = 0;
          st.round = (st.round || 0) + 1;
        }
        st.left = total();
        const finished = rounds > 0 && st.round >= rounds;
        if (finished) st.round = 0;
        st.endsAt = manual || finished ? null : Date.now() + st.left;
        save();
        return finished;
      };
      const label = () => {
        const s = plan[st.step];
        if (s.kind === "long") return t("w.longBreak");
        if (s.kind === "break") return t("w.break");
        const n = plan.slice(0, st.step + 1).filter((x) => x.kind === "focus").length;
        return focusTotal > 1 ? `${t("w.focus")} ${n}/${focusTotal}` : t("w.focus");
      };
      const render = () => {
        const day = (/* @__PURE__ */ new Date()).toDateString();
        if (st.day !== day) {
          st.count = 0;
          st.day = day;
          save();
        }
        if (st.endsAt && remaining() <= 0) {
          const was = plan[st.step].kind;
          const finished = advance(false);
          buzz(finished ? "0,200,120,200,120,200,120,600" : "0,200,120,200,120,400");
          const next = plan[st.step].kind;
          toast(finished ? "Sequence finished, well done" : next === "long" ? "Time for a long break" : next === "break" ? "Time for a break" : was === "focus" ? "Next focus session" : "Back to focus", "ok", "\u{1F345} Pomodoro", 5);
        }
        const left = remaining();
        const kind = plan[st.step].kind;
        box.classList.toggle("brk", kind !== "focus");
        box.classList.toggle("long", kind === "long");
        box.classList.toggle("run", !!st.endsAt);
        if (svg) svg.remove();
        dial.insertAdjacentHTML("afterbegin", ringSvg(100 * (1 - left / total())));
        svg = dial.firstElementChild;
        time.textContent = fmtTime(left + 999);
        phase.textContent = label();
        const tomatoes = st.count ? "\u{1F345}".repeat(Math.min(st.count, 6)) + (st.count > 6 ? ` \xD7${st.count}` : "") : t("w.noSessionsToday");
        count.textContent = custom.bad ? `Sequence not understood: "${custom.bad}"` : rounds > 1 ? `Round ${(st.round || 0) + 1}/${rounds} \xB7 ${tomatoes}` : tomatoes;
        play.textContent = st.endsAt ? "\u23F8" : "\u25B6";
      };
      play.addEventListener("click", () => {
        haptic();
        if (st.endsAt) {
          st.left = remaining();
          st.endsAt = null;
        } else st.endsAt = Date.now() + st.left;
        save();
        render();
      });
      reset.addEventListener("click", () => {
        haptic();
        if (!st.endsAt && st.left === total()) {
          st.step = 0;
          st.round = 0;
        }
        st.endsAt = null;
        st.left = total();
        save();
        render();
      });
      skip.addEventListener("click", () => {
        haptic();
        advance(true);
        render();
      });
      return { update: render };
    }
  };
  W.countdown = {
    needs: ["tick"],
    create(box, { o }) {
      const m = String(o.target || "").trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2}):(\d{2})(?::\d{2})?)?$/);
      let target = NaN;
      if (m) {
        const [, year, month, day, hour = "0", minute = "0"] = m;
        const date = /* @__PURE__ */ new Date(0);
        date.setFullYear(+year, +month - 1, +day);
        date.setHours(+hour, +minute, 0, 0);
        if (date.getFullYear() === +year && date.getMonth() === +month - 1 && date.getDate() === +day && +hour < 24 && +minute < 60) {
          target = date.getTime();
        }
      }
      const big = h("div", "cd-v"), sub = h("div", "cd-s");
      box.append(h("div", "cd-l", o.label || "Countdown"), big, sub);
      if (Number.isNaN(target)) {
        big.textContent = "\u2014";
        sub.textContent = t("w.setDateFormat");
        return {};
      }
      sub.textContent = new Date(target).toLocaleDateString(LOCALE, { weekday: "short", day: "numeric", month: "short", year: "numeric" }) + ", " + fmtHM(new Date(target));
      return {
        update() {
          let d = target - Date.now();
          const past = d < 0;
          d = Math.abs(d);
          const days = Math.floor(d / 864e5), hrs = Math.floor(d % 864e5 / 36e5), mins = Math.floor(d % 36e5 / 6e4), secs = Math.floor(d % 6e4 / 1e3);
          big.textContent = (past ? "+" : "") + (days ? `${days}d ${hrs}h` : hrs ? `${hrs}h ${pad(mins)}m` : `${mins}:${pad(secs)}`);
          box.classList.toggle("past", past);
        }
      };
    }
  };
  W.note = {
    bare: true,
    needs: [],
    create(box, { o }) {
      var _a;
      const text = String((_a = o.text) != null ? _a : "");
      box.style.setProperty("--n", o.color || "#fbbf24");
      box.style.setProperty("--nf", text.length < 25 ? 15 : text.length < 70 ? 10.5 : text.length < 160 ? 8 : 6.5);
      box.append(h("div", "note-t", text));
      return {};
    }
  };
  W.label = {
    bare: true,
    needs: [],
    create(box, { o }) {
      box.append(h("div", "lbl-t", o.text || ""));
      return {};
    }
  };
  W.command = {
    needs: ["tick"],
    create(box, { o, page, w }) {
      const out = h("div", "cmd-o", "\u2026"), foot = h("div", "cmd-f", "");
      box.append(h("div", "w-title", o.title || "Command"), out, foot);
      let last = 0, busy = false, res = null;
      const load = (force) => __async(this, null, function* () {
        var _a;
        if (busy) return;
        busy = true;
        try {
          res = yield api(`/widget/${encodeURIComponent(page.id)}/${encodeURIComponent(w.id)}${force ? "?force=true" : ""}`, "GET", 4e3);
          const text = (_a = res.output) != null ? _a : "";
          out.textContent = text || (res.running ? t("w.running") : t("w.noOutput"));
          const short = text.length <= 14 && !text.includes("\n");
          out.classList.toggle("big", short);
          box.classList.toggle("bad", res.ok === false);
        } catch (_) {
          if (!res) out.textContent = online ? t("w.unavailable") : "\u2014";
        }
        busy = false;
      });
      box.addEventListener("click", () => {
        haptic();
        last = Date.now();
        load(true).then(() => setTimeout(() => load(false), 1500));
      });
      return {
        update() {
          if (res == null ? void 0 : res.at) foot.textContent = (res.running ? "refreshing \xB7 " : "") + ago(res.at) + (res.durationMs ? ` \xB7 ${Math.round(res.durationMs)} ms` : "");
          if (!online || Date.now() - last < ((res == null ? void 0 : res.running) || !(res == null ? void 0 : res.at) ? 2e3 : 5e3)) return;
          last = Date.now();
          load(false);
        }
      };
    }
  };
  W.push = {
    needs: ["push", "tick"],
    create(box, { o }) {
      const key = o.key || "";
      let lastAt = -1;
      const render = () => {
        var _a, _b, _c, _d, _e;
        const item = D.push[key];
        if (!item) {
          if (lastAt === 0) return;
          lastAt = 0;
          box.style.removeProperty("--c");
          box.replaceChildren(h("div", "w-title", o.title || key), h("div", "push-empty", t("w.noDataYet"), h("code", null, `POST /api/push/${key}`)));
          return;
        }
        const ageEl = box.querySelector(".push-age");
        if (item.at === lastAt) {
          if (ageEl) ageEl.textContent = ago(item.at);
          return;
        }
        lastAt = item.at;
        const v = pushView(item);
        const lvl = levelOf(v);
        const c = v.color || LEVEL_COLOR[lvl] || "";
        if (c) box.style.setProperty("--c", c);
        else box.style.removeProperty("--c");
        const unit = (_b = (_a = v.unit) != null ? _a : o.unit) != null ? _b : "";
        const style = o.style && o.style !== "auto" ? o.style : v.items ? "list" : "big";
        const title = h("div", "w-title", (v.icon ? v.icon + " " : "") + (o.title || v.title || key), h("span", "push-age w-sub", ago(item.at)));
        let body;
        if (style === "list") {
          const items = v.items || (v.value != null ? [v.value] : []);
          body = h("div", "push-list", items.slice(0, 30).map((x) => {
            var _a2, _b2, _c2, _d2, _e2, _f;
            if (x && typeof x === "object") {
              const li = h("div", "pl-i", h("span", "pl-l", (_c2 = (_b2 = (_a2 = x.label) != null ? _a2 : x.title) != null ? _b2 : x.name) != null ? _c2 : ""), h("span", "pl-v", fmtValue((_e2 = (_d2 = x.value) != null ? _d2 : x.status) != null ? _e2 : "")));
              const lc = LEVEL_COLOR[x.level || levelOf({ value: (_f = x.value) != null ? _f : x.status })];
              if (lc) li.style.setProperty("--lc", lc);
              return li;
            }
            return h("div", "pl-i", h("span", "pl-l", fmtValue(x)));
          }));
        } else if (style === "gauge") {
          const min = (_c = v.min) != null ? _c : typeof o.min === "number" ? o.min : 0, max = (_d = v.max) != null ? _d : typeof o.max === "number" ? o.max : 100;
          const num = typeof v.value === "number" ? v.value : parseFloat(v.value);
          const pct = v.progress != null ? v.progress * 100 : Number.isFinite(num) ? (num - min) / (max - min || 1) * 100 : 0;
          const dial = h("div", "g-dial");
          dial.innerHTML = ringSvg(pct);
          dial.appendChild(h("div", "g-val", fmtValue((_e = v.value) != null ? _e : Math.round(pct)), h("small", null, unit)));
          box.style.setProperty("--q", c || "var(--cpu)");
          body = h("div", "push-gauge", dial, v.sub ? h("div", "g-sub", v.sub) : null);
        } else {
          body = h(
            "div",
            "push-big",
            h("div", "pv", fmtValue(v.value), unit ? h("small", null, unit) : null),
            v.sub ? h("div", "ps", String(v.sub)) : null,
            v.progress != null ? h("div", "track", h("i")) : null
          );
          const bar = body.querySelector(".track i");
          if (bar) bar.style.width = Math.max(0, Math.min(100, v.progress * 100)) + "%";
        }
        box.className = box.className.replace(/\bps-\w+/g, "") + " ps-" + style;
        box.replaceChildren(title, body);
      };
      return { update: render };
    }
  };
  W.inbox = {
    needs: ["notes", "tick"],
    create(box) {
      const list = h("div", "inbox");
      const clear = h("button", "mini-btn", "Clear");
      clear.addEventListener("click", () => {
        haptic();
        D.notes = [];
        store.set("notes", []);
        emit("notes");
      });
      box.append(h("div", "w-title", "Notifications", clear), list);
      let shown = "";
      return {
        update(kind) {
          var _a;
          const key = D.notes.length + ":" + (((_a = D.notes[0]) == null ? void 0 : _a.at) || 0) + ":" + Math.floor(Date.now() / 6e4);
          if (key === shown && kind === "tick") return;
          shown = key;
          list.replaceChildren(...D.notes.length ? D.notes.map((n) => {
            const e = h("div", "ib-i", h("div", "ib-h", h("b", null, n.title || n.text), h("span", null, ago(n.at))), n.title && n.text ? h("div", "ib-t", n.text) : null);
            e.style.setProperty("--lc", LEVEL_COLOR[n.level] || "var(--dim)");
            return e;
          }) : [h("div", "empty", t("w.notifyEmpty"))]);
        }
      };
    }
  };

  // ../../../tmp/claude-0/-home-claude/d7433526-111a-5017-bcc4-3fd104415c33/scratchpad/pb/src/android/app/src/main/assets/www/widgets/stack.js
  function parseWidgets(raw) {
    let list = [];
    if (Array.isArray(raw)) {
      list = raw;
    } else if (typeof raw === "string") {
      const s = raw.trim();
      if (s.startsWith("[") && s.endsWith("]")) {
        try {
          list = JSON.parse(s);
        } catch (_) {
          list = s.split("\n");
        }
      } else {
        list = s.split(/[\n,]+/).map((x) => x.trim()).filter(Boolean);
      }
    }
    if (!list || list.length === 0 && !Array.isArray(raw)) {
      return [
        { type: "clock", options: {}, enabled: true },
        { type: "weather", options: {}, enabled: true },
        { type: "media", options: {}, enabled: true }
      ];
    }
    const normalized = list.slice(0, 12).map((item, index) => {
      if (!item) return null;
      if (typeof item === "object") {
        if (!item.type) return null;
        return {
          id: String(item.id || `card-${index}`),
          type: String(item.type).trim(),
          options: item.options || {},
          enabled: item.enabled !== false && item.active !== false
        };
      }
      const str = String(item).trim();
      if (str.startsWith("{") && str.endsWith("}")) {
        try {
          const obj = JSON.parse(str);
          if (obj.type) {
            return {
              id: String(obj.id || `card-${index}`),
              type: String(obj.type).trim(),
              options: obj.options || {},
              enabled: obj.enabled !== false && obj.active !== false
            };
          }
        } catch (_) {
        }
      }
      return { id: `card-${index}`, type: str, options: {}, enabled: true };
    }).filter((x) => x && x.type && !["stack", "command"].includes(x.type));
    return normalized.filter((x) => x.enabled);
  }
  W.stack = {
    needs: ["tick"],
    /**
     * Creates the Smart Stack widget instance with rotation, swipe, and pause controls.
     */
    create(box, ctx) {
      const o = ctx.o || {};
      const subDefs = parseWidgets(o.widgets);
      const wrap = h("div", "stack-wrap");
      box.appendChild(wrap);
      if (subDefs.length === 0) {
        wrap.appendChild(h("div", "empty", t("w.stackEmpty")));
        return {
          needs: ["tick"],
          update() {
          },
          destroy() {
          }
        };
      }
      const children = [];
      const collectedNeeds = /* @__PURE__ */ new Set(["tick"]);
      subDefs.forEach((item, i) => {
        var _a;
        const def = W[item.type];
        const itemEl = h("div", `stack-item${i === 0 ? " active" : ""}`);
        itemEl.setAttribute("aria-hidden", String(i !== 0));
        itemEl.inert = i !== 0;
        const subBox = h("div", `w w-${item.type}${(def == null ? void 0 : def.bare) ? " bare" : " card"}`);
        PhoneBoxAppearance.widget(subBox, ctx.appearance);
        itemEl.appendChild(subBox);
        wrap.appendChild(itemEl);
        const subW = __spreadProps(__spreadValues({}, ctx.w), { id: `${ctx.w.id}:${item.id || `card-${i}`}`, type: item.type, options: item.options || {} });
        const subCtx = {
          page: ctx.page,
          w: subW,
          o: subW.options,
          box: subBox
        };
        let inst = {};
        if (def) {
          try {
            inst = def.create(subBox, subCtx) || {};
          } catch (err) {
            console.warn(`stack: error creating child ${item.type}`, err);
            subBox.replaceChildren(h("div", "empty", `${item.type}: ${err.message}`));
          }
        } else {
          subBox.replaceChildren(h("div", "empty", `Unknown widget: ${item.type}`));
        }
        const needs = inst.needs || (def == null ? void 0 : def.needs) || [];
        for (const need of needs) collectedNeeds.add(need);
        children.push({ item, inst, needs, always: (_a = inst.always) != null ? _a : def == null ? void 0 : def.always, el: itemEl });
      });
      let currentIndex = 0;
      let lastRotate = Date.now();
      let paused = false;
      let destroyed = false;
      let dots = null;
      let pauseBtn = null;
      let clearHold = () => {
      };
      function syncPauseUi() {
        if (paused) box.dataset.stackPaused = "1";
        else __pbDeleteData(box, "stackPaused");
        if (dots) dots.classList.toggle("paused", paused);
        if (pauseBtn) {
          pauseBtn.classList.toggle("on", paused);
          pauseBtn.setAttribute("aria-pressed", String(paused));
          pauseBtn.title = paused ? t("w.stackPaused") : t("w.stackPause");
        }
      }
      function togglePaused() {
        if (children.length <= 1 || !dots) return;
        paused = !paused;
        lastRotate = Date.now();
        syncPauseUi();
        haptic();
      }
      function goTo(nextIdx, dir = "next") {
        var _a, _b;
        if (children.length <= 1) return;
        const target = (nextIdx + children.length) % children.length;
        if (target === currentIndex) return;
        const prevChild = children[currentIndex];
        const nextChild = children[target];
        prevChild.el.classList.remove("active", "prev");
        prevChild.el.setAttribute("aria-hidden", "true");
        prevChild.el.inert = true;
        if (dir === "next") {
          prevChild.el.classList.add("prev");
        }
        nextChild.el.classList.remove("prev");
        nextChild.el.classList.add("active");
        nextChild.el.setAttribute("aria-hidden", "false");
        nextChild.el.inert = false;
        currentIndex = target;
        if (dots) {
          dots.querySelectorAll(".stack-dot").forEach((d, idx) => {
            d.classList.toggle("active", idx === currentIndex);
            d.classList.toggle("on", idx === currentIndex);
          });
        }
        for (const need of nextChild.needs) {
          try {
            (_b = (_a = nextChild.inst).update) == null ? void 0 : _b.call(_a, need);
          } catch (_) {
          }
        }
      }
      if (o.showDots !== false && children.length > 1) {
        dots = h("nav", "stack-dots");
        children.forEach((c, idx) => {
          const dot = h("button", `stack-dot${idx === 0 ? " active on" : ""}`);
          dot.type = "button";
          dot.title = c.item.type;
          dot.setAttribute("aria-label", c.item.type);
          dot.addEventListener("click", (e) => {
            e.stopPropagation();
            haptic();
            goTo(idx, idx > currentIndex ? "next" : "prev");
            resetTimer();
          });
          dots.appendChild(dot);
        });
        pauseBtn = h("button", "stack-pause");
        pauseBtn.type = "button";
        pauseBtn.setAttribute("aria-label", "Pause stack rotation");
        pauseBtn.innerHTML = '<svg class="i-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg><svg class="i-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
        pauseBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          togglePaused();
        });
        dots.appendChild(pauseBtn);
        syncPauseUi();
        box.appendChild(dots);
        let holdTimer = 0, holdStart = null, heldDots2 = false;
        clearHold = () => {
          if (holdTimer) {
            clearTimeout(holdTimer);
            holdTimer = 0;
          }
          holdStart = null;
        };
        dots.addEventListener("pointerdown", (e) => {
          heldDots2 = false;
          clearHold();
          if (e.pointerType === "mouse" && e.button !== 0) return;
          if (e.target.closest(".stack-pause")) return;
          holdStart = [e.clientX, e.clientY];
          holdTimer = setTimeout(() => {
            holdTimer = 0;
            holdStart = null;
            heldDots2 = true;
            togglePaused();
          }, 450);
        });
        dots.addEventListener("pointermove", (e) => {
          if (holdStart && Math.hypot(e.clientX - holdStart[0], e.clientY - holdStart[1]) > 10) clearHold();
        });
        ["pointerup", "pointercancel", "pointerleave"].forEach((ev) => dots.addEventListener(ev, clearHold));
        dots.addEventListener("click", (e) => {
          if (heldDots2) {
            heldDots2 = false;
            if (!e.target.closest(".stack-pause")) {
              e.preventDefault();
              e.stopPropagation();
            }
          }
        }, true);
      }
      wrap.style.touchAction = "pan-x";
      let startX = 0, startY = 0, startT = 0, swiping = false;
      wrap.addEventListener("touchstart", (e) => {
        swiping = e.touches.length === 1 && !e.target.closest("button, input, textarea, select, a, [contenteditable], .s-list");
        if (!swiping) return;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        startT = Date.now();
      }, { passive: true });
      wrap.addEventListener("touchend", (e) => {
        if (!swiping || !e.changedTouches || e.changedTouches.length !== 1) return;
        swiping = false;
        const dx = e.changedTouches[0].clientX - startX;
        const dy = e.changedTouches[0].clientY - startY;
        const dt = Date.now() - startT;
        if (dt < 600) {
          if (Math.abs(dy) > 30 && Math.abs(dy) > Math.abs(dx)) {
            haptic();
            if (dy < 0) goTo(currentIndex + 1, "next");
            else goTo(currentIndex - 1, "prev");
            resetTimer();
          }
        }
      }, { passive: true });
      let intervalSec = o.interval === void 0 || o.interval === null || o.interval === "" ? 10 : Number(o.interval);
      if (!Number.isFinite(intervalSec)) intervalSec = 10;
      else if (intervalSec > 0) intervalSec = Math.min(600, Math.max(3, intervalSec));
      else intervalSec = 0;
      function resetTimer() {
        lastRotate = Date.now();
      }
      return {
        needs: Array.from(collectedNeeds),
        always: children.some((child) => child.always),
        /**
         * Handles periodic tick and widget data updates for the stack and its children.
         */
        update(kind, background) {
          var _a, _b, _c;
          if (destroyed) return;
          if (kind === "tick" && !background) {
            const r = box.getBoundingClientRect();
            const visible = r.right > 0 && r.left < innerWidth && r.bottom > 0 && r.top < innerHeight && !document.hidden;
            const activeChildEl = (_a = children[currentIndex]) == null ? void 0 : _a.el;
            if (!visible || paused) lastRotate = Date.now();
            else if (intervalSec > 0 && Date.now() - lastRotate >= intervalSec * 1e3 && !(activeChildEl == null ? void 0 : activeChildEl.contains(document.activeElement))) {
              goTo(currentIndex + 1, "next");
              lastRotate = Date.now();
            }
          }
          for (const child of children) {
            if ((!background || child.always) && child.needs.includes(kind)) {
              try {
                (_c = (_b = child.inst).update) == null ? void 0 : _c.call(_b, kind);
              } catch (e) {
                console.warn(child.item.type, e);
              }
            }
          }
        },
        /**
         * Cleans up timers, DOM state, and child widget instances.
         */
        destroy() {
          var _a, _b;
          destroyed = true;
          clearHold();
          __pbDeleteData(box, "stackPaused");
          for (const child of children) {
            try {
              (_b = (_a = child.inst).destroy) == null ? void 0 : _b.call(_a);
            } catch (_) {
            }
          }
          children.length = 0;
        }
      };
    }
  };

  // ../../../tmp/claude-0/-home-claude/d7433526-111a-5017-bcc4-3fd104415c33/scratchpad/pb/src/android/app/src/main/assets/www/widgets/time.js
  W.analog = {
    bare: true,
    needs: ["tick"],
    create(box, { o }) {
      const showSec = o.seconds !== false;
      let fmt = null;
      if (o.zone) {
        try {
          fmt = new Intl.DateTimeFormat("en-GB", { timeZone: o.zone, hour: "numeric", minute: "numeric", second: "numeric", hourCycle: "h23" });
        } catch (_) {
        }
      }
      const ticks = Array.from({ length: 60 }, (_, i) => {
        const big = i % 5 === 0, a = i * Math.PI / 30, r12 = big ? 40 : 43.5;
        return `<line class="tk${big ? " b" : ""}" x1="${(50 + r12 * Math.sin(a)).toFixed(2)}" y1="${(50 - r12 * Math.cos(a)).toFixed(2)}" x2="${(50 + 46.5 * Math.sin(a)).toFixed(2)}" y2="${(50 - 46.5 * Math.cos(a)).toFixed(2)}"/>`;
      }).join("");
      const nums = o.numbers ? [12, 3, 6, 9].map((n, i) => `<text x="${50 + 33 * Math.sin(i * Math.PI / 2)}" y="${50 - 33 * Math.cos(i * Math.PI / 2) + 3.6}">${n}</text>`).join("") : "";
      box.innerHTML = `<svg viewBox="0 0 100 100" class="analog"><circle class="face" cx="50" cy="50" r="48.5"/>${ticks}${nums}<line class="hh" x1="50" y1="53" x2="50" y2="27"/><line class="mh" x1="50" y1="55" x2="50" y2="12"/>` + (showSec ? '<line class="sh" x1="50" y1="60" x2="50" y2="8"/>' : "") + '<circle class="hub" cx="50" cy="50" r="2.4"/></svg>';
      if (o.label) box.append(h("div", "an-l", o.label));
      const [hh, mh, sh] = [".hh", ".mh", ".sh"].map((s) => box.querySelector(s));
      return {
        update() {
          let H, M, S;
          if (fmt) {
            const p = Object.fromEntries(fmt.formatToParts(/* @__PURE__ */ new Date()).map((x) => [x.type, +x.value]));
            [H, M, S] = [p.hour, p.minute, p.second];
          } else {
            const d = /* @__PURE__ */ new Date();
            [H, M, S] = [d.getHours(), d.getMinutes(), d.getSeconds()];
          }
          hh.setAttribute("transform", `rotate(${H % 12 * 30 + M * 0.5} 50 50)`);
          mh.setAttribute("transform", `rotate(${M * 6 + S * 0.1} 50 50)`);
          sh == null ? void 0 : sh.setAttribute("transform", `rotate(${S * 6} 50 50)`);
        }
      };
    }
  };
  W.progress = {
    needs: ["tick"],
    create(box) {
      const rows = ["Day", "Week", "Month", "Year"].map((n) => {
        const pct = h("span"), bar = h("i");
        const row = h("div", "pr-row", h("div", "m-row", h("span", null, n), pct), h("div", "track", bar));
        return { pct, bar, row };
      });
      box.append(h("div", "w-title", "Time"), h("div", "pr-list", rows.map((r) => r.row)));
      let shown = -1;
      return {
        update() {
          const now = /* @__PURE__ */ new Date();
          if (now.getMinutes() === shown) return;
          shown = now.getMinutes();
          const day0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const day1 = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
          const wk0 = new Date(day0);
          wk0.setDate(day0.getDate() - (day0.getDay() + 6) % 7);
          const wk1 = new Date(wk0);
          wk1.setDate(wk0.getDate() + 7);
          const m0 = new Date(now.getFullYear(), now.getMonth(), 1), m1 = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          const y0 = new Date(now.getFullYear(), 0, 1), y1 = new Date(now.getFullYear() + 1, 0, 1);
          const vals = [(now - day0) / (day1 - day0), (now - wk0) / (wk1 - wk0), (now - m0) / (m1 - m0), (now - y0) / (y1 - y0)];
          vals.forEach((v, i) => {
            rows[i].pct.textContent = (v * 100).toFixed(i === 3 ? 1 : 0) + "%";
            rows[i].bar.style.width = v * 100 + "%";
          });
        }
      };
    }
  };
  W.stopwatch = {
    needs: ["fast"],
    create(box, { page, w }) {
      const key = `sw:${page.id}/${w.id}`;
      let st = store.get(key, null) || { start: null, acc: 0, laps: [] };
      const save = () => store.set(key, st);
      const t2 = h("div", "sw-t"), laps = h("div", "sw-laps");
      const a = h("button", "pb main", "\u25B6"), b = h("button", "pb", "\u21BA");
      box.append(h("div", "w-title", "Stopwatch"), t2, h("div", "pomo-btns", b, a), laps);
      const elapsed = () => st.acc + (st.start ? Date.now() - st.start : 0);
      const fmtSw = (ms) => {
        const s = Math.floor(ms / 1e3);
        const hh = Math.floor(s / 3600);
        return (hh ? hh + ":" + pad(Math.floor(s % 3600 / 60)) : Math.floor(s / 60)) + ":" + pad(s % 60) + "." + Math.floor(ms % 1e3 / 100);
      };
      const renderLaps = () => laps.replaceChildren(...st.laps.slice(-6).reverse().map((l, i, arr) => h("div", "sw-lap", h("span", null, "#" + (st.laps.length - i)), h("span", null, fmtSw(l)))));
      const paint = () => {
        a.textContent = st.start ? "\u23F8" : "\u25B6";
        b.textContent = st.start ? "\u2691" : "\u21BA";
        box.classList.toggle("run", !!st.start);
      };
      a.addEventListener("click", () => {
        haptic();
        if (st.start) {
          st.acc = elapsed();
          st.start = null;
        } else st.start = Date.now();
        save();
        paint();
      });
      b.addEventListener("click", () => {
        haptic();
        if (st.start) st.laps.push(elapsed());
        else st = { start: null, acc: 0, laps: [] };
        save();
        paint();
        renderLaps();
      });
      paint();
      renderLaps();
      return { update() {
        t2.textContent = fmtSw(elapsed());
      } };
    }
  };
  W.timer = {
    needs: ["tick"],
    always: true,
    // the alarm goes off on whatever page is showing
    create(box, { o, page, w }) {
      const key = `tm:${page.id}/${w.id}`;
      const presets = lines(o.presets, ["1", "3", "5", "10", "15", "25"]).map(Number).filter((n) => n > 0).slice(0, 8);
      let st = store.get(key, null) || { endsAt: null, left: 0, total: 0 };
      const save = () => store.set(key, st);
      const dial = dialEl(), btns = h("div", "tm-btns");
      box.append(h("div", "w-title", o.label || "Timer"), dial, btns);
      box.style.setProperty("--q", o.color || "#38bdf8");
      const remaining = () => st.endsAt ? Math.max(0, st.endsAt - Date.now()) : st.left;
      const renderBtns = () => {
        if (!st.total) {
          btns.replaceChildren(...presets.map((m) => {
            const b = h("button", "chip-btn", m + "m");
            b.addEventListener("click", () => {
              haptic();
              st = { endsAt: Date.now() + m * 6e4, left: m * 6e4, total: m * 6e4 };
              save();
              renderBtns();
              render();
            });
            return b;
          }));
        } else {
          const p = h("button", "pb main", st.endsAt ? "\u23F8" : "\u25B6"), x = h("button", "pb", "\u2715");
          p.addEventListener("click", () => {
            haptic();
            if (st.endsAt) {
              st.left = remaining();
              st.endsAt = null;
            } else st.endsAt = Date.now() + st.left;
            save();
            renderBtns();
          });
          x.addEventListener("click", () => {
            haptic();
            st = { endsAt: null, left: 0, total: 0 };
            save();
            renderBtns();
            render();
          });
          btns.replaceChildren(x, p);
        }
      };
      const render = () => {
        if (st.endsAt && remaining() <= 0) {
          st = { endsAt: null, left: 0, total: 0 };
          save();
          renderBtns();
          buzz("0,300,150,300,150,600");
          toast("Time is up", "ok", "\u23F3 " + (o.label || "Timer"), 6);
        }
        const left = remaining();
        dial.set(st.total ? 100 * (left / st.total) : 0, st.total ? fmtTime(left + 999) : "\u2014");
        box.classList.toggle("run", !!st.endsAt);
      };
      renderBtns();
      return { update: render };
    }
  };
  W.counter = {
    needs: ["tick"],
    create(box, { o, page, w }) {
      const key = `ct:${page.id}/${w.id}`;
      let st = store.get(key, null) || { n: 0, day: (/* @__PURE__ */ new Date()).toDateString() };
      const step = Number(o.step) || 1;
      const num = h("div", "ct-n"), minus = h("button", "pb", "\u2212"), plus = h("button", "pb main", "+"), reset = h("button", "mini-btn", "Reset");
      box.style.setProperty("--q", o.color || "#a78bfa");
      box.append(h("div", "w-title", o.label || "Counter", reset), num, h("div", "pomo-btns", minus, plus));
      const fresh = () => {
        const today = (/* @__PURE__ */ new Date()).toDateString();
        if (o.daily !== false && st.day !== today) {
          st = { n: 0, day: today };
          num.textContent = st.n;
        }
      };
      const set = (n) => {
        st.n = n;
        st.day = (/* @__PURE__ */ new Date()).toDateString();
        store.set(key, st);
        num.textContent = st.n;
      };
      plus.addEventListener("click", () => {
        haptic();
        fresh();
        set(st.n + step);
      });
      minus.addEventListener("click", () => {
        haptic();
        fresh();
        set(st.n - step);
      });
      reset.addEventListener("click", () => {
        haptic();
        set(0);
      });
      fresh();
      num.textContent = st.n;
      return { update: fresh };
    }
  };
  W.breathe = {
    needs: ["tick"],
    create(box, { o }) {
      const PATTERNS = { box: [["Inhale", 4], ["Hold", 4], ["Exhale", 4], ["Hold", 4]], relax: [["Inhale", 4], ["Hold", 7], ["Exhale", 8]], calm: [["Inhale", 5], ["Exhale", 5]] };
      const phases = PATTERNS[o.pattern] || PATTERNS.box;
      const cycle = phases.reduce((a, p) => a + p[1], 0);
      const ball = h("div", "br-ball"), word = h("div", "br-w", t("w.tapToStart")), count = h("div", "br-c");
      box.append(h("div", "br-stage", ball, h("div", "br-txt", word, count)));
      let start = null, lastPhase = -1;
      box.addEventListener("click", () => {
        haptic();
        start = start ? null : Date.now();
        lastPhase = -1;
        if (!start) {
          ball.style.transition = "transform 1s ease";
          ball.style.transform = "scale(.45)";
          word.textContent = t("w.tapToStart");
          count.textContent = "";
        }
      });
      ball.style.transform = "scale(.45)";
      return {
        update() {
          if (!start) return;
          let t2 = (Date.now() - start) / 1e3 % cycle, i = 0;
          while (t2 >= phases[i][1]) {
            t2 -= phases[i][1];
            i++;
          }
          const [name, secs] = phases[i];
          if (i !== lastPhase) {
            lastPhase = i;
            ball.style.transition = `transform ${secs}s ease-in-out`;
            if (name === "Inhale") ball.style.transform = "scale(1)";
            if (name === "Exhale") ball.style.transform = "scale(.45)";
            word.textContent = name;
          }
          count.textContent = Math.ceil(secs - t2);
        }
      };
    }
  };
  var QUOTES = [
    ["The best way out is always through.", "Robert Frost"],
    ["Simplicity is the ultimate sophistication.", "Leonardo da Vinci"],
    ["Well begun is half done.", "Aristotle"],
    ["Premature optimization is the root of all evil.", "Donald Knuth"],
    ["Talk is cheap. Show me the code.", "Linus Torvalds"],
    ["First, solve the problem. Then, write the code.", "John Johnson"],
    ["Programs must be written for people to read.", "Harold Abelson"],
    ["Make it work, make it right, make it fast.", "Kent Beck"],
    ["Deleted code is debugged code.", "Jeff Sickel"],
    ["Waste no more time arguing what a good man should be. Be one.", "Marcus Aurelius"],
    ["What stands in the way becomes the way.", "Marcus Aurelius"],
    ["We suffer more often in imagination than in reality.", "Seneca"],
    ["Luck is what happens when preparation meets opportunity.", "Seneca"],
    ["Do what you can, with what you have, where you are.", "Theodore Roosevelt"],
    ["Nothing in life is to be feared, it is only to be understood.", "Marie Curie"],
    ["Imagination is more important than knowledge.", "Albert Einstein"],
    ["Knowledge is power.", "Francis Bacon"],
    ["Measure twice, cut once.", "Proverb"],
    ["Rome wasn\u2019t built in a day.", "Proverb"],
    ["Drop by drop, a lake is formed.", "Turkish proverb"],
    ["Patience is bitter, but its fruit is sweet.", "Proverb"],
    ["A journey of a thousand miles begins with a single step.", "Laozi"]
  ];
  W.quote = {
    needs: ["tick"],
    create(box, { o }) {
      const custom = lines(o.quotes, []).map((l) => {
        const i = l.lastIndexOf(" \u2014 ");
        return i > 0 ? [l.slice(0, i), l.slice(i + 3)] : [l, ""];
      });
      const list = custom.length ? custom : QUOTES;
      const mins = Math.max(1, Number(o.minutes) || 30);
      const q = h("div", "qt-q"), a = h("div", "qt-a");
      box.append(h("div", "qt-mark", "\u201C"), q, a);
      let offset = 0, shown = -1;
      const pick = () => {
        const idx = (Math.floor(Date.now() / (mins * 6e4)) + offset) % list.length;
        if (idx === shown) return;
        shown = idx;
        q.textContent = list[idx][0];
        a.textContent = list[idx][1] ? "\u2014 " + list[idx][1] : "";
        box.style.setProperty("--qf", list[idx][0].length < 40 ? 1.25 : list[idx][0].length < 80 ? 1 : 0.8);
      };
      box.addEventListener("click", () => {
        haptic();
        offset++;
        pick();
      });
      return { update: pick };
    }
  };
  W.checklist = {
    needs: ["tick"],
    create(box, { o, page, w }) {
      const items = lines(o.items, ["Water the plants", "Stretch", "Inbox zero"]);
      const key = `cl:${page.id}/${w.id}`;
      const day = () => (/* @__PURE__ */ new Date()).toDateString();
      let st = store.get(key, null) || { day: day(), done: [] };
      const fresh = () => {
        if (o.daily !== false && st.day !== day()) st = { day: day(), done: [] };
      };
      const head = h("span", "w-sub");
      const list = h("div", "cl-list");
      box.append(h("div", "w-title", o.title || t("time.today"), head), list);
      const render = () => {
        fresh();
        const n = items.filter((x) => st.done.includes(x)).length;
        head.textContent = `${n} / ${items.length}`;
        box.classList.toggle("all", n === items.length && n > 0);
        list.replaceChildren(...items.map((it) => {
          const done = st.done.includes(it);
          const row = h("button", "cl-i" + (done ? " done" : ""), h("span", "cl-box", done ? "\u2713" : ""), h("span", "cl-t", it));
          row.addEventListener("click", () => {
            haptic();
            st.done = done ? st.done.filter((x) => x !== it) : [...st.done, it];
            st.day = day();
            store.set(key, st);
            render();
          });
          return row;
        }));
      };
      let lastDay = day();
      render();
      return { update() {
        if (day() !== lastDay) {
          lastDay = day();
          render();
        }
      } };
    }
  };
  var NUM_WORDS = ["twelve", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven"];
  function timeInWords(d) {
    const total = d.getHours() * 60 + d.getMinutes();
    const r = Math.round(total / 5) * 5;
    const exact = r === total, over = total > r;
    const m = r % 60, hr = Math.floor(r / 60) % 24;
    const hourName = (x) => NUM_WORDS[x % 12];
    const minutes = { 5: "five", 10: "ten", 15: "quarter", 20: "twenty", 25: "twenty-five", 30: "half" };
    let main;
    if (m === 0) main = hr === 0 ? ["midnight"] : hr === 12 ? ["noon"] : [hourName(hr), "o'clock"];
    else if (m <= 30) main = [minutes[m], "past", hourName(hr)];
    else main = [minutes[60 - m], "to", hourName(hr + 1)];
    return { lead: exact ? "it's" : over ? "it's just after" : "it's almost", main };
  }
  W.wordclock = {
    bare: true,
    needs: ["tick"],
    create(box) {
      const lead = h("div", "wc-lead"), main = h("div", "wc-main"), date = h("div", "wc-date");
      box.append(lead, main, date);
      let shown = "";
      return {
        update() {
          const now = /* @__PURE__ */ new Date();
          const t2 = timeInWords(now);
          const k = t2.lead + t2.main.join(" ");
          if (k === shown) return;
          shown = k;
          lead.textContent = t2.lead;
          main.replaceChildren(...t2.main.map((w, i) => h("span", i === t2.main.length - 1 || t2.main.length === 1 ? "hr" : null, w + " ")));
          date.textContent = now.toLocaleDateString(LOCALE, { weekday: "long", day: "numeric", month: "long" });
        }
      };
    }
  };

  // ../../../tmp/claude-0/-home-claude/d7433526-111a-5017-bcc4-3fd104415c33/scratchpad/pb/src/android/app/src/main/assets/www/widgets/pc.js
  var HTML_PRELUDE = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark"><style>:root{color-scheme:dark}html,body{margin:0;height:100%;background:transparent;color:#eef2f6;font-family:Roboto,"Segoe UI",system-ui,sans-serif;overflow:hidden}</style>
<script>(function(){var subs={},data={};window.phonebox={data:data,
on:function(k,f){(subs[k]=subs[k]||[]).push(f);if(data[k]!==undefined)try{f(data[k])}catch(e){console.error(e)}},
run:function(id){parent.postMessage({phonebox:'run',id:String(id)},'*')},
goto:function(p){parent.postMessage({phonebox:'goto',page:p},'*')}};
addEventListener('message',function(e){var m=e.data;if(!m||m.phonebox!=='data')return;data[m.kind]=m.value;(subs[m.kind]||[]).forEach(function(f){try{f(m.value)}catch(err){console.error(err)}})});})();<\/script>`;
  var HTML_KINDS = ["state", "push", "weather", "work", "quotas"];
  W.html = {
    needs: HTML_KINDS,
    create(box, { o }) {
      if (o.transparent) box.classList.add("bare-html");
      const frame2 = h("iframe", "html-frame");
      frame2.setAttribute("sandbox", "allow-scripts");
      frame2.setAttribute("referrerpolicy", "no-referrer");
      frame2.srcdoc = HTML_PRELUDE + (o.html || "");
      box.append(frame2);
      const send = (kind) => {
        var _a;
        if (D[kind] != null) try {
          (_a = frame2.contentWindow) == null ? void 0 : _a.postMessage({ phonebox: "data", kind, value: D[kind] }, "*");
        } catch (_) {
        }
      };
      frame2.addEventListener("load", () => HTML_KINDS.forEach(send));
      const onMsg = (e) => {
        if (e.source !== frame2.contentWindow || !e.data) return;
        if (e.data.phonebox === "run" && (cfg.shortcuts || []).some((s) => s.id === e.data.id)) {
          haptic();
          api("/run/" + encodeURIComponent(e.data.id), "POST", 5e3).catch(() => toast(t("panel.pcNoAnswer"), "err"));
        }
        if (e.data.phonebox === "goto") gotoPageRef(e.data.page);
      };
      window.addEventListener("message", onMsg);
      return {
        update(kind) {
          if (HTML_KINDS.includes(kind)) send(kind);
        },
        destroy() {
          window.removeEventListener("message", onMsg);
        }
      };
    }
  };
  var BAT_ICONS = { headphones: "\u{1F3A7}", mouse: "\u{1F5B1}\uFE0F", keyboard: "\u2328\uFE0F", controller: "\u{1F3AE}", laptop: "\u{1F4BB}", pen: "\u{1F58A}\uFE0F", phone: "\u{1F4F1}", other: "\u{1F50B}" };
  W.batteries = {
    needs: ["tick"],
    create(box, { o }) {
      const low = +o.low || 20;
      let data = null, lastKey = "";
      const list = h("div", "bt-list");
      box.append(h("div", "w-title", o.title || "Batteries"), list);
      const load = () => __async(this, null, function* () {
        try {
          data = yield api("/batteries");
        } catch (_) {
        }
      });
      const render = () => {
        const devices = [...(data == null ? void 0 : data.devices) || []];
        if (o.phone !== false && bridge) {
          try {
            const b = JSON.parse(bridge.battery());
            if (b.level >= 0) devices.push({ name: "This phone", level: b.level, kind: "phone", charging: b.plugged });
          } catch (_) {
          }
        }
        const key = JSON.stringify([devices, box.clientHeight]);
        if (key === lastKey) return;
        lastKey = key;
        if (!data && !devices.length) {
          list.replaceChildren(h("div", "empty", t("w.loading")));
          return;
        }
        if (!devices.length) {
          list.replaceChildren(h("div", "empty", "No wireless devices report a battery level"));
          return;
        }
        list.replaceChildren(...devices.map((d) => {
          const col = d.level <= low ? "#ef4444" : d.level <= low * 2 ? "#f59e0b" : "#22c55e";
          const row = h(
            "div",
            "bt-row" + (d.level <= low ? " low" : ""),
            h("span", "bt-ico", BAT_ICONS[d.kind] || "\u{1F50B}"),
            h("span", "bt-name", d.name),
            h("span", "bt-bar", h("i")),
            h("b", "bt-pct", (d.charging ? "\u26A1" : "") + d.level + "%")
          );
          row.style.setProperty("--c", col);
          row.style.setProperty("--v", d.level / 100);
          return row;
        }));
      };
      const tick2 = every(3e4, () => __async(this, null, function* () {
        yield load();
        render();
      }));
      return { update: () => {
        tick2();
        render();
      } };
    }
  };
  W.obs = {
    needs: ["tick"],
    create(box, { o }) {
      let data = null, lastKey = "", fetchedAt = 0, busy = null;
      const load = () => __async(this, null, function* () {
        try {
          data = yield api("/obs");
          fetchedAt = Date.now();
        } catch (_) {
        }
      });
      const dur = (ms) => {
        const s = Math.floor(ms / 1e3);
        return (s >= 3600 ? Math.floor(s / 3600) + ":" : "") + pad(Math.floor(s / 60) % 60) + ":" + pad(s % 60);
      };
      const act = (action, scene) => __async(this, null, function* () {
        haptic();
        busy = action + (scene || "");
        render(true);
        try {
          const r = yield fetch(`${API}/obs/${action}` + (scene ? "?scene=" + encodeURIComponent(scene) : ""), { method: "POST", cache: "no-store", headers: PANEL_HEADERS });
          if (!r.ok) toast((yield r.json().catch(() => ({}))).error || "OBS did not do it", "err");
        } catch (_) {
          toast(t("panel.pcNoAnswer"), "err");
        }
        setTimeout(() => __async(this, null, function* () {
          yield load();
          busy = null;
          render(true);
        }), 600);
      });
      const render = (force = false) => {
        const s = data == null ? void 0 : data.snapshot;
        const since = Date.now() - fetchedAt;
        const key = JSON.stringify([data, busy, Math.floor(Date.now() / 1e3), box.clientHeight]);
        if (!force && key === lastKey) return;
        lastKey = key;
        if (!data) {
          box.replaceChildren(h("div", "empty", t("w.loading")));
          return;
        }
        if (!data.enabled) {
          box.replaceChildren(h("div", "w-title", "OBS"), h("div", "empty", "Turn on OBS in Settings \u203A General"));
          return;
        }
        if (!s.connected) {
          box.replaceChildren(h("div", "w-title", "OBS"), h("div", "empty", s.error || t("panel.connecting")));
          return;
        }
        const ctl = data.control;
        const pill = (on, label, cls, time, action) => {
          const el = h("div", "obs-pill " + cls + (on ? " on" : "") + (ctl ? " can" : "") + (busy === action ? " busy" : ""), h("span", "obs-led"), h("b", null, label), h("span", "obs-time", on ? dur(time + since) : "off"));
          if (ctl) el.addEventListener("click", () => act(action));
          return el;
        };
        const recLabel = s.recordPaused ? "PAUSED" : "REC";
        const kids = [
          h("div", "obs-top", pill(s.streaming, "LIVE", "live", s.streamMs, "stream"), pill(s.recording, recLabel, "rec", s.recordPaused ? s.recordMs - since : s.recordMs, "record")),
          h(
            "div",
            "obs-scene",
            h("span", null, "Scene"),
            h("b", null, s.scene || "\u2014"),
            s.micMuted != null ? h("span", "obs-mic" + (s.micMuted ? " muted" : ""), s.micMuted ? "\u{1F507}" : "\u{1F399}\uFE0F") : null
          )
        ];
        if (o.scenes !== false && s.scenes.length) {
          kids.push(h("div", "obs-scenes", ...s.scenes.map((name) => {
            const b = h("button", "obs-sc" + (name === s.scene ? " cur" : "") + (busy === "scene" + name ? " busy" : ""), name);
            if (ctl && name !== s.scene) b.addEventListener("click", () => act("scene", name));
            return b;
          })));
        }
        box.replaceChildren(...kids);
        const mic = box.querySelector(".obs-mic");
        if (mic && ctl) mic.addEventListener("click", (e) => {
          e.stopPropagation();
          act("mic");
        });
      };
      const tick2 = every(2e3, () => __async(this, null, function* () {
        yield load();
        render();
      }));
      return { update: () => {
        tick2();
        render();
      } };
    }
  };
  W.discord = {
    needs: ["tick"],
    create(box, { o }) {
      let data = null, lastKey = "", busy = null;
      const open = /* @__PURE__ */ new Set();
      const ico = (src, name) => {
        const w = h("span", "dc-ico", (name || "?").trim().charAt(0).toUpperCase() || "?");
        if (src) {
          const im = new Image();
          im.alt = "";
          im.onload = () => w.replaceChildren(im);
          im.src = src;
        }
        return w;
      };
      const load = () => __async(this, null, function* () {
        try {
          data = yield api("/discord");
        } catch (_) {
        }
      });
      const img = (kind, id, hash) => `${API}/discord/img?kind=${kind}&id=${encodeURIComponent(id)}&hash=${encodeURIComponent(hash)}`;
      const act = (action, channel) => __async(this, null, function* () {
        if (busy) return;
        haptic();
        busy = action + (channel || "");
        render(true);
        try {
          const r = yield fetch(`${API}/discord/${action}` + (channel ? "?channel=" + encodeURIComponent(channel) : ""), { method: "POST", cache: "no-store", headers: PANEL_HEADERS });
          if (!r.ok) toast((yield r.json().catch(() => ({}))).error || t("w.discord.failed"), "err");
        } catch (_) {
          toast(t("panel.pcNoAnswer"), "err");
        }
        yield new Promise((done) => setTimeout(done, 600));
        yield load();
        busy = null;
        render(true);
      });
      const render = (force = false) => {
        const key = JSON.stringify([data, busy, [...open], box.clientHeight]);
        if (!force && key === lastKey) return;
        lastKey = key;
        if (!data) {
          box.replaceChildren(h("div", "empty", t("w.loading")));
          return;
        }
        if (!data.enabled) {
          box.replaceChildren(h("div", "w-title", "Discord"), h("div", "empty", t("w.discord.turnOn")));
          return;
        }
        const s = data.snapshot;
        if (!s.connected) {
          box.replaceChildren(h("div", "w-title", "Discord"), h("div", "empty", s.error || t("panel.connecting")));
          return;
        }
        const ctl = data.control;
        const btn = (cls, label, on, action) => {
          const b = h("button", "dc-btn " + cls + (on ? " on" : "") + (busy === action ? " busy" : ""), label);
          if (ctl && !busy) b.addEventListener("click", () => act(action));
          else b.disabled = true;
          return b;
        };
        const kids = [h(
          "div",
          "dc-top",
          h("span", "dc-where", s.channelName ? `${s.channelName}` : t("w.discord.notInChannel")),
          s.channelKind ? h("span", "dc-kind", s.channelKind) : null,
          btn("mute", s.muted ? "\u{1F507}" : "\u{1F399}\uFE0F", s.muted, "mute"),
          btn("deaf", s.deafened ? "\u{1F515}" : "\u{1F3A7}", s.deafened, "deafen"),
          s.channelId ? btn("leave", "\u{1F4DE}", false, "leave") : null
        )];
        if (s.channelId && s.members.length) {
          kids.push(h("div", "dc-members", ...s.members.map((m) => h("span", "dc-member" + (m.deafened ? " deaf" : m.muted ? " muted" : ""), ico(m.avatar && img("user", m.id, m.avatar), m.name), (m.deafened ? "\u{1F515} " : m.muted ? "\u{1F507} " : "") + m.name))));
        }
        if (o.channels !== false && s.channels.length) {
          const servers = /* @__PURE__ */ new Map();
          for (const c of s.channels) {
            const gid = c.guildId || c.guild || "other";
            if (!servers.has(gid)) servers.set(gid, []);
            servers.get(gid).push(c);
          }
          kids.push(h("div", "dc-servers", ...[...servers].map(([gid, chans]) => {
            const here = chans.some((c) => c.id === s.channelId);
            const isOpen = open.has(gid) || here && !open.has("!" + gid);
            const g = chans[0];
            const name = g.guild || t("w.discord.otherServer");
            const head = h(
              "button",
              "dc-server" + (isOpen ? " open" : "") + (here ? " here" : ""),
              ico(g.guildIcon && g.guildId && img("guild", g.guildId, g.guildIcon), name),
              h("span", "dc-stext", h("b", null, name), h("small", null, t(chans.length === 1 ? "w.discord.channel" : "w.discord.channels", { n: chans.length })))
            );
            head.addEventListener("click", () => {
              haptic();
              if (isOpen) {
                open.delete(gid);
                if (here) open.add("!" + gid);
              } else {
                open.add(gid);
                open.delete("!" + gid);
              }
              render(true);
            });
            const block = h("div", "dc-block" + (isOpen ? " open" : ""), head);
            if (isOpen) {
              block.append(h("div", "dc-chans", ...chans.map((c) => {
                const b = h("button", "dc-chan" + (c.id === s.channelId ? " cur" : "") + (busy === "join" + c.id ? " busy" : ""), "\u{1F50A} " + c.name);
                if (ctl && !busy && c.id !== s.channelId) b.addEventListener("click", () => act("join", c.id));
                return b;
              })));
            }
            return block;
          })));
        }
        if (o.notifications !== false && s.notifications.length) {
          kids.push(h("div", "dc-notes", ...s.notifications.slice(0, 6).map((n) => h("div", "dc-note", h("b", null, n.title), h("span", null, n.body)))));
        }
        box.replaceChildren(...kids);
      };
      const tick2 = every(2e3, () => __async(this, null, function* () {
        yield load();
        render();
      }));
      return { update: () => {
        tick2();
        render();
      } };
    }
  };
  var HA_ICONS = {
    light: "\u{1F4A1}",
    switch: "\u{1F50C}",
    fan: "\u{1F300}",
    cover: "\u{1FA9F}",
    media_player: "\u{1F3B5}",
    scene: "\u{1F3AC}",
    script: "\u{1F4DC}",
    automation: "\u{1F916}",
    climate: "\u{1F321}\uFE0F",
    person: "\u{1F9D1}",
    vacuum: "\u{1F9F9}",
    camera: "\u{1F4F7}",
    input_boolean: "\u{1F518}",
    button: "\u{1F518}",
    input_button: "\u{1F518}",
    sun: "\u2600\uFE0F",
    weather: "\u26C5"
  };
  var HA_CLASS_ICONS = {
    temperature: "\u{1F321}\uFE0F",
    humidity: "\u{1F4A7}",
    power: "\u26A1",
    energy: "\u26A1",
    battery: "\u{1F50B}",
    illuminance: "\u2600\uFE0F",
    door: "\u{1F6AA}",
    garage_door: "\u{1F6AA}",
    window: "\u{1FA9F}",
    motion: "\u{1F3C3}",
    occupancy: "\u{1F9CD}",
    presence: "\u{1F9CD}",
    moisture: "\u{1F4A7}",
    smoke: "\u{1F525}",
    gas: "\u{1F525}",
    co2: "\u{1FAE7}",
    carbon_dioxide: "\u{1FAE7}",
    pm25: "\u{1F32B}\uFE0F",
    connectivity: "\u{1F4F6}",
    plug: "\u{1F50C}",
    outlet: "\u{1F50C}",
    lock: "\u{1F512}",
    sound: "\u{1F50A}",
    vibration: "\u{1F4F3}"
  };
  var HA_SWITCHABLE = /* @__PURE__ */ new Set([
    "light",
    "switch",
    "fan",
    "input_boolean",
    "automation",
    "siren",
    "humidifier",
    "group",
    "cover",
    "media_player",
    "scene",
    "script",
    "button",
    "input_button",
    "lock",
    "vacuum"
  ]);
  var HA_ACTIVE = /* @__PURE__ */ new Set(["on", "open", "opening", "unlocked", "playing", "home", "cleaning", "heat", "cool", "heat_cool", "auto", "detected"]);
  function haState(e) {
    const s = e.state, dom = e.id.split(".")[0], dc = e.deviceClass;
    if (s === "unavailable" || s === "unknown") return s === "unknown" ? "\u2014" : t("w.unavailable");
    if (dom === "binary_sensor") {
      const on = s === "on";
      if (["door", "window", "garage_door", "opening"].includes(dc)) return on ? "Open" : "Closed";
      if (["motion", "occupancy", "presence"].includes(dc)) return on ? "Detected" : "Clear";
      if (dc === "moisture") return on ? "Wet" : "Dry";
      return on ? "On" : "Off";
    }
    if (dom === "scene" || dom === "script" || dom === "button" || dom === "input_button") return "Run";
    if (/^-?\d+(\.\d+)?$/.test(s)) {
      const n = +s;
      return (Math.abs(n) >= 100 ? Math.round(n) : Math.round(n * 10) / 10) + (e.unit ? " " + e.unit : "");
    }
    return s.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
  }
  W.ha = {
    needs: ["tick"],
    create(box, { o }) {
      const ids = String(o.entities || "").split(/[\s,;]+/).filter((x) => x.includes("."));
      let data = null, lastKey = "", busy = null;
      const grid = h("div", "ha-grid");
      if (o.title) box.append(h("div", "w-title", o.title));
      box.append(grid);
      const load = () => __async(this, null, function* () {
        try {
          data = yield api("/ha/states?ids=" + encodeURIComponent(ids.join(",")));
        } catch (_) {
        }
      });
      const toggle = (e) => __async(this, null, function* () {
        haptic();
        busy = e.id;
        render(true);
        try {
          const r = yield fetch(`${API}/ha/toggle/${encodeURIComponent(e.id)}`, { method: "POST", cache: "no-store", headers: PANEL_HEADERS });
          if (!r.ok) toast((yield r.json().catch(() => ({}))).error || "Could not switch it", "err");
        } catch (_) {
          toast(t("panel.pcNoAnswer"), "err");
        }
        setTimeout(() => __async(this, null, function* () {
          yield load();
          busy = null;
          render(true);
        }), 700);
      });
      const render = (force = false) => {
        const key = JSON.stringify([data, busy]);
        if (!force && key === lastKey) return;
        lastKey = key;
        if (!ids.length) {
          grid.replaceChildren(h("div", "empty", "List entity ids in the widget settings, e.g. light.desk"));
          return;
        }
        if (!data) {
          grid.replaceChildren(h("div", "empty", t("w.loading")));
          return;
        }
        if (!data.configured) {
          grid.replaceChildren(h("div", "empty", data.error));
          return;
        }
        grid.replaceChildren(...data.entities.map((e) => {
          const dom = e.id.split(".")[0];
          const active = HA_ACTIVE.has(e.state);
          const icon2 = dom === "lock" ? e.state === "unlocked" ? "\u{1F513}" : "\u{1F512}" : HA_CLASS_ICONS[e.deviceClass] || HA_ICONS[dom] || "\u25FB\uFE0F";
          const can = o.control === true && HA_SWITCHABLE.has(dom) && e.state !== "unavailable";
          const tile = h(
            "div",
            "ha-tile" + (active ? " on" : "") + (can ? " can" : "") + (busy === e.id ? " busy" : "") + (e.state === "unavailable" ? " gone" : ""),
            h("span", "ha-ico", icon2),
            h("span", "ha-name", e.name),
            h("b", "ha-state", haState(e))
          );
          if (can) tile.addEventListener("click", () => toggle(e));
          return tile;
        }), ...data.error ? [h("div", "ha-err", "\u26A0 " + data.error)] : []);
      };
      const tick2 = every(4e3, () => __async(this, null, function* () {
        yield load();
        render();
      }));
      return { update: () => {
        tick2();
        render();
      } };
    }
  };
  W.docker = {
    needs: ["tick"],
    create(box, { o }) {
      const filter = String(o.filter || "").toLowerCase();
      let data = null, open = null, busy = null, lastKey = "";
      const list = h("div", "dk-list"), head = h("div", "w-title", o.title || "Docker", h("span", "dk-count"));
      box.append(head, list);
      const act = (c, action) => __async(this, null, function* () {
        haptic();
        busy = c.id;
        render(true);
        try {
          const r = yield fetch(`${API}/docker/${encodeURIComponent(c.id)}/${action}`, { method: "POST", cache: "no-store", headers: PANEL_HEADERS });
          const j = yield r.json().catch(() => ({}));
          if (!r.ok) toast(j.error || `Could not ${action} ${c.name}`, "err");
          else toast(`${c.name}: ${action === "stop" ? "stopped" : action === "start" ? "started" : "restarted"}`, "ok");
        } catch (_) {
          toast(t("panel.pcNoAnswer"), "err");
        }
        busy = null;
        open = null;
        yield load();
        render(true);
      });
      const load = () => __async(this, null, function* () {
        try {
          data = yield api("/docker");
        } catch (_) {
        }
      });
      const render = (force = false) => {
        const snap = data == null ? void 0 : data.snapshot;
        const matched = ((snap == null ? void 0 : snap.containers) || []).filter((c) => !filter || c.name.toLowerCase().includes(filter) || (c.project || "").toLowerCase().includes(filter));
        const items = o.stopped === false ? matched.filter((c) => c.state === "running") : matched;
        const key = JSON.stringify([!!data, snap == null ? void 0 : snap.available, snap == null ? void 0 : snap.error, (snap == null ? void 0 : snap.updated) === 0, matched.length, items, data == null ? void 0 : data.control, open, busy, box.clientHeight]);
        if (!force && key === lastKey) return;
        lastKey = key;
        const running = items.filter((c) => c.state === "running").length;
        head.querySelector(".dk-count").textContent = (snap == null ? void 0 : snap.available) && (!snap.error || matched.length) ? ` ${running}/${matched.length}` : "";
        if (!data || !(snap == null ? void 0 : snap.updated) && !(snap == null ? void 0 : snap.error)) {
          list.replaceChildren(h("div", "empty", t("w.loading")));
          return;
        }
        if (!snap.available || snap.error && !items.length) {
          list.replaceChildren(h("div", "empty", snap.error || "Docker is not running"));
          return;
        }
        if (!items.length) {
          const msg = matched.length ? `No running containers (${matched.length} stopped)` : filter ? `No containers match "${o.filter}"` : "No containers";
          list.replaceChildren(h("div", "empty", msg));
          return;
        }
        list.replaceChildren(...items.map((c) => {
          const st = c.health === "unhealthy" ? "bad" : c.state === "running" ? c.health === "starting" ? "warn" : "ok" : c.state === "restarting" || c.state === "paused" ? "warn" : "off";
          const row = h(
            "div",
            "dk-row " + st + (open === c.id ? " open" : ""),
            h("span", "dk-dot"),
            h("span", "dk-name", c.name, h("small", null, " " + (c.project ? c.project + " \xB7 " : "") + c.image.split("@")[0])),
            h("span", "dk-stat", busy === c.id ? "\u2026" : c.state === "running" ? c.cpu != null ? `${c.cpu.toFixed(1)}%` + (c.mem ? ` \xB7 ${c.mem}` : "") : c.status : c.status.replace(/ ago$/, ""))
          );
          row.addEventListener("click", () => {
            if (!data.control) {
              toast('Turn on "Allow start / stop" in the widget settings on the PC');
              return;
            }
            haptic();
            open = open === c.id ? null : c.id;
            render(true);
          });
          if (open !== c.id) return row;
          const btn = (label, action, cls = "") => {
            const b = h("button", "dk-btn " + cls, label);
            b.addEventListener("click", (e) => {
              e.stopPropagation();
              act(c, action);
            });
            return b;
          };
          return h("div", "dk-wrap", row, h("div", "dk-acts", ...c.state === "running" ? [btn("\u21BB Restart", "restart"), btn("\u25A0 Stop", "stop", "danger")] : [btn("\u25B6 Start", "start", "go")]));
        }));
      };
      const tick2 = every(4e3, () => __async(this, null, function* () {
        yield load();
        render();
      }));
      return { update: () => {
        tick2();
        render();
      } };
    }
  };
  W.apps = {
    needs: ["tick"],
    create(box, { o }) {
      const pinned = String(o.pinned || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
      const confirm = o.confirm !== false;
      let data = null, q = "", busy = null, armed = null, armTimer = 0, lastKey = "";
      const disarm = () => {
        clearTimeout(armTimer);
        if (armed) {
          armed = null;
          render(true);
        }
      };
      const head = h("div", "w-title", o.title || "Apps", h("span", "ap-count"));
      const search = h("input", "ap-search");
      search.type = "search";
      search.placeholder = "Search apps";
      search.autocomplete = "off";
      search.spellcheck = false;
      search.addEventListener("input", () => {
        q = search.value.trim().toLowerCase();
        render(true);
      });
      const grid = h("div", "ap-grid");
      box.append(head, ...o.search === false ? [] : [search], grid);
      const load = () => __async(this, null, function* () {
        try {
          data = yield api("/apps", "GET", 1e4);
        } catch (_) {
          return false;
        }
      });
      const open = (a) => __async(this, null, function* () {
        if (!(data == null ? void 0 : data.canOpen)) {
          toast("Opening apps needs an All apps widget saved on a page");
          return;
        }
        haptic();
        busy = a.id;
        render(true);
        try {
          const r = yield fetch(`${API}/apps/open?id=${encodeURIComponent(a.id)}`, { method: "POST", cache: "no-store", headers: PANEL_HEADERS });
          const j = yield r.json().catch(() => ({}));
          if (r.ok) toast(`Opening ${a.name}`, "ok");
          else toast(j.error || `Could not open ${a.name}`, "err");
        } catch (_) {
          toast("The PC did not answer", "err");
        }
        busy = null;
        render(true);
      });
      const rank = (a) => {
        const i = pinned.indexOf(a.name.toLowerCase());
        return i < 0 ? pinned.length : i;
      };
      const tile = (a) => {
        const img = h("img", "ap-ico");
        img.loading = "lazy";
        img.decoding = "async";
        img.alt = "";
        const src = `${API}/apps/icon?id=${encodeURIComponent(a.id)}`;
        img.src = src;
        img.addEventListener("error", () => {
          const letter = h("span", "ap-ico ap-letter", a.name.slice(0, 1).toUpperCase());
          img.replaceWith(letter);
          setTimeout(() => {
            if (!letter.isConnected) return;
            const again = h("img", "ap-ico");
            again.alt = "";
            again.addEventListener("load", () => {
              if (letter.isConnected) letter.replaceWith(again);
            }, { once: true });
            again.src = src + "&retry=1";
          }, 15e3);
        }, { once: true });
        const isArmed = armed === a.id;
        const t2 = h(
          "button",
          "ap-tile" + (busy === a.id ? " busy" : "") + (isArmed ? " armed" : ""),
          img,
          h("span", "ap-name", isArmed ? "Tap again to open" : a.name)
        );
        t2.title = a.name;
        t2.addEventListener("click", () => {
          if (!confirm || armed === a.id) {
            clearTimeout(armTimer);
            armed = null;
            open(a);
            return;
          }
          haptic();
          armed = a.id;
          clearTimeout(armTimer);
          armTimer = setTimeout(disarm, 4e3);
          render(true);
        });
        return t2;
      };
      const render = (force = false) => {
        const all = (data == null ? void 0 : data.apps) || [];
        const items = all.filter((a) => !q || a.name.toLowerCase().includes(q)).sort((x, y) => rank(x) - rank(y) || x.name.localeCompare(y.name));
        const key = JSON.stringify([items.map((a) => a.id), busy, armed, data == null ? void 0 : data.supported, data == null ? void 0 : data.canOpen]);
        if (!force && key === lastKey) return;
        lastKey = key;
        head.querySelector(".ap-count").textContent = all.length ? ` ${q ? items.length + "/" : ""}${all.length}` : "";
        if (!data) {
          grid.replaceChildren(h("div", "empty", "Loading\u2026"));
          return;
        }
        if (!data.supported) {
          grid.replaceChildren(h("div", "empty", "The apps list is available on macOS for now"));
          return;
        }
        if (!items.length) {
          grid.replaceChildren(h("div", "empty", q ? `No apps match "${search.value.trim()}"` : "No apps found"));
          return;
        }
        grid.replaceChildren(...items.map(tile));
      };
      const tick2 = every(6e4, () => __async(this, null, function* () {
        const ok = yield load();
        render();
        return ok;
      }), 5e3);
      return { update: () => {
        tick2();
        render();
      } };
    }
  };
  W.agenda = {
    needs: ["calendar", "tick"],
    create(box, { o }) {
      const days = Math.max(1, Math.min(14, +o.days || 7));
      const only = String(o.calendars || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
      let lastKey = "";
      const hm = (ms) => fmtHM(new Date(ms));
      const dayKey = (ms) => new Date(ms).toDateString();
      const dayName = (ms) => {
        const d = new Date(ms), now = /* @__PURE__ */ new Date();
        const diff = Math.round((new Date(d.toDateString()) - new Date(now.toDateString())) / 864e5);
        return diff === 0 ? t("time.today") : diff === 1 ? t("time.tomorrow") : d.toLocaleDateString(LOCALE, { weekday: "short", day: "numeric", month: "short" });
      };
      const inMin = (ms) => {
        const m = Math.round((ms - Date.now()) / 6e4);
        return m < 1 ? t("time.now") : m < 60 ? t("time.inDur", { dur: t("time.min", { m }) }) : m < 24 * 60 ? t("time.inDur", { dur: fmtDur(ms - Date.now()) }) : "";
      };
      const render = () => {
        var _a, _b;
        const cal = D.calendar;
        const now = Date.now();
        const today = new Date(now);
        const wholeDays = Math.floor(days);
        const until = new Date(today.getFullYear(), today.getMonth(), today.getDate() + wholeDays).getTime() + (days - wholeDays) * 864e5;
        const list = ((cal == null ? void 0 : cal.events) || []).filter((e) => e.end > now && e.start < until && (!only.length || only.includes(e.calendar.toLowerCase())));
        const small = box.clientHeight < 110;
        const key = JSON.stringify([list.map((e) => e.start + e.title), Math.floor(now / 3e4), small, box.clientHeight]);
        if (key === lastKey) return;
        lastKey = key;
        box.classList.toggle("small", small);
        if (!cal) {
          box.replaceChildren(h("div", "empty", t("w.loading")));
          return;
        }
        if (!cal.updated && !list.length) {
          box.replaceChildren(h("div", "w-title", o.title || "Agenda"), h("div", "empty", "Add a calendar in Settings \u203A General"));
          return;
        }
        const timed = list.filter((e) => !e.allDay);
        const cur = timed.find((e) => e.start <= now);
        const next = timed.find((e) => e.start > now);
        if (small) {
          const e = cur || next || list[0];
          if (!e) {
            box.replaceChildren(h("div", "ag-big-t", "No events"), h("div", "ag-big-s", `next ${days} days`));
            return;
          }
          box.style.setProperty("--c", e.color);
          box.replaceChildren(
            h("div", "ag-big-s", e === cur ? `Now \xB7 until ${hm(e.end)}` : e.allDay ? dayName(e.start) + " \xB7 all day" : `${dayName(e.start) === t("time.today") ? inMin(e.start) || t("time.today") : dayName(e.start)} \xB7 ${hm(e.start)}`),
            h("div", "ag-big-t", e.title)
          );
          return;
        }
        const rows = [];
        let lastDay = "";
        for (const e of list) {
          const at2 = e.start < now ? now : e.start;
          const dk = dayKey(at2);
          if (dk !== lastDay) {
            rows.push(h("div", "ag-day", dayName(at2)));
            lastDay = dk;
          }
          const isNow = e === cur;
          const row = h(
            "div",
            "ag-row" + (isNow ? " now" : ""),
            h("span", "ag-dot"),
            h("span", "ag-time", e.allDay ? "all day" : hm(e.start)),
            h("span", "ag-title", e.title, o.location !== false && e.location ? h("small", null, " \xB7 " + e.location) : null),
            h("span", "ag-when", isNow ? `until ${hm(e.end)}` : e === next ? inMin(e.start) : "")
          );
          row.style.setProperty("--c", e.color);
          if (isNow) row.style.setProperty("--p", Math.min(1, (now - e.start) / Math.max(1, e.end - e.start)));
          rows.push(row);
        }
        const body = h("div", "ag-list", ...rows.length ? rows : [h("div", "empty", `Nothing in the next ${days} days`)]);
        box.replaceChildren(h("div", "w-title", o.title || "Agenda", ((_a = cal.errors) == null ? void 0 : _a.length) ? h("span", "ag-err", " \u26A0") : null), body);
        while (body.scrollHeight > body.clientHeight + 2 && body.childElementCount > 1) {
          body.lastElementChild.remove();
          if ((_b = body.lastElementChild) == null ? void 0 : _b.classList.contains("ag-day")) body.lastElementChild.remove();
        }
      };
      return { update: render };
    }
  };
  W.onair = {
    needs: ["state", "push"],
    create(box, { o }) {
      const sign = h("div", "oa-sign", o.text || "ON AIR"), sub = h("div", "oa-sub");
      box.append(sign, sub);
      const src = o.source || "both";
      return {
        update() {
          var _a, _b, _c, _d, _e;
          const p = (_a = D.state) == null ? void 0 : _a.privacy;
          const mic = (src === "both" || src === "mic") && !!(p == null ? void 0 : p.mic);
          const cam = (src === "both" || src === "camera") && !!(p == null ? void 0 : p.camera);
          const obs = (_b = D.state) == null ? void 0 : _b.obs;
          const obsLive = (src === "both" || src === "obs") && !!obs && (obs.streaming || obs.recording && !obs.recordPaused);
          const pushKey = (_c = o.key) != null ? _c : "onair";
          let pv = pushKey ? (_e = (_d = D.push) == null ? void 0 : _d[pushKey]) == null ? void 0 : _e.data : null;
          if (pv && typeof pv === "object" && "value" in pv) pv = pv.value;
          const pushed = pv != null && pv !== false && pv !== 0 && !/^(|0|false|off|no)$/i.test(String(pv));
          const on = mic || cam || obsLive || pushed;
          box.classList.toggle("on", on);
          const apps = [.../* @__PURE__ */ new Set([...mic ? p.micApps || [] : [], ...cam ? p.cameraApps || [] : []])];
          sub.textContent = on ? [mic ? "\u{1F399}\uFE0F" : "", cam ? "\u{1F4F7}" : "", obsLive ? obs.streaming ? "OBS live" : "OBS recording" : "", apps.join(", ") || (pushed && typeof pv === "string" ? pv : "")].filter(Boolean).join(" ") : (src === "mic" || src === "camera") && p && p.mic == null ? "Not detectable on this computer" : "Off air";
        }
      };
    }
  };
  W.battery = {
    needs: ["tick"],
    create(box) {
      const dial = dialEl(), sub = h("div", "g-sub");
      box.append(dial, h("div", "g-label", "PHONE"), sub);
      const load = every(2e4, () => {
        if (!bridge) {
          dial.set(0, "\u2014");
          sub.textContent = "Only on the phone";
          return;
        }
        try {
          const b = JSON.parse(bridge.battery());
          box.style.setProperty("--q", b.plugged ? "#22c55e" : b.level <= 20 ? "#ef4444" : b.level <= 40 ? "#f59e0b" : "#84cc16");
          dial.set(b.level, b.level, "%");
          sub.textContent = (b.plugged ? "\u26A1 Charging" : "On battery") + (b.temp ? ` \xB7 ${b.temp.toFixed(0)}\xB0C` : "");
        } catch (_) {
        }
      });
      return { update: load };
    }
  };
  W.pcswitch = {
    needs: ["state"],
    create(box, { o }) {
      const row = h("div", "pcs-row"), sub = h("div", "pcs-sub");
      box.append(o.title === "" ? "" : h("div", "w-title", o.title || "Computers"), row, sub);
      let shown = "";
      const render = () => {
        const pcs = pairedPcs(), usb = transport() === "usb";
        const key = JSON.stringify([pcs, usb, !!bridge]);
        if (key === shown) return;
        shown = key;
        if (!bridge) {
          row.replaceChildren(h("div", "empty", "Only on the phone"));
          sub.textContent = "";
          return;
        }
        if (pcs.length < 2) {
          row.replaceChildren(h("div", "empty", pcs.length ? "Pair another computer over Wi-Fi to switch here" : "No computer paired over Wi-Fi"));
          sub.textContent = "";
          return;
        }
        row.replaceChildren(...pcs.map((pc) => {
          const b = h("button", "ov-pc" + (pc.active && !usb ? " on" : ""), "\u{1F5A5}\uFE0F " + (pc.name || t("panel.computer")));
          b.disabled = usb;
          b.addEventListener("click", (e) => {
            e.stopPropagation();
            switchPc(pc);
          });
          return b;
        }));
        sub.textContent = usb ? "USB cable connected: the panel uses that computer" : "";
      };
      render();
      return { update: render };
    }
  };
  W.topprocs = {
    needs: ["procs", "state"],
    create(box, { o }) {
      const byMem = o.sort === "mem";
      const list = h("div", "tp-list");
      box.style.setProperty("--c", "#f472b6");
      const title = h("div", "w-title", byMem ? "Top memory" : "Top CPU");
      box.append(title, list);
      const rowMap = /* @__PURE__ */ new Map();
      return {
        update() {
          var _a, _b;
          const pc = (_a = D.state) == null ? void 0 : _a.pc;
          if (byMem && (pc == null ? void 0 : pc.ramTotalGb)) {
            const pct = Math.round(pc.ramUsedGb / pc.ramTotalGb * 100);
            title.textContent = `Top memory (${pct}% \xB7 ${Math.round(pc.ramUsedGb)}/${Math.round(pc.ramTotalGb)} GB)`;
          } else if (!byMem && (pc == null ? void 0 : pc.cpu) != null) {
            title.textContent = `Top CPU (${Math.round(pc.cpu)}%)`;
          }
          const data = D.procs;
          if (!((_b = data == null ? void 0 : data.groups) == null ? void 0 : _b.length)) {
            rowMap.clear();
            list.replaceChildren(h("div", "empty", t("w.measuring")));
            return;
          }
          if (list.querySelector(".empty")) list.replaceChildren();
          const n = Math.max(1, Math.floor((box.clientHeight - 30) / 24));
          const top = [...data.groups].sort((a, b) => byMem ? b.memMb - a.memMb : b.cpu - a.cpu).slice(0, n);
          const keep = new Set(top.map((g) => g.name));
          for (const [k, el] of rowMap) if (!keep.has(k)) {
            el.remove();
            rowMap.delete(k);
          }
          for (const g of top) {
            let row = rowMap.get(g.name);
            if (!row) {
              const ico = h("div", "p-ico");
              fillIcon(ico, g);
              row = h("div", "tp-i", ico, h("span", "tp-n"), h("b"));
              row.addEventListener("click", () => {
                haptic();
                openSheet(row._g, canKillAnywhere());
              });
              rowMap.set(g.name, row);
            }
            row._g = g;
            row.querySelector(".tp-n").textContent = g.title + (g.count > 1 ? ` \xD7${g.count}` : "");
            row.querySelector("b").textContent = byMem ? fmtMem(g.memMb) : g.cpu.toFixed(1) + "%";
            list.appendChild(row);
          }
        }
      };
    }
  };
  W.quotaring = {
    needs: ["quotas", "tick"],
    create(box, { o }) {
      const prov = o.provider || "claude", idx = Number(o.limit) || 0;
      const st = Q_STYLE[prov] || { color: "#94a3b8", logo: "\u25CF" };
      box.style.setProperty("--q", st.color);
      const dial = dialEl(), label = h("div", "g-label"), sub = h("div", "g-sub");
      box.append(dial, label, sub);
      let last = 0;
      const render = () => {
        var _a;
        const p = quotaProviders().find((x) => x.id === prov);
        const l = (_a = p == null ? void 0 : p.limits) == null ? void 0 : _a[idx];
        if (!l) {
          dial.set(0, "\u2014");
          label.textContent = `${st.logo} ${(p == null ? void 0 : p.name) || prov}`;
          sub.textContent = D.quotas ? "No data" : "Waiting\u2026";
          return;
        }
        const pace = paceInfo(l);
        dial.style.setProperty("--qc", l.percent >= 95 ? "#ef4444" : l.percent >= 80 ? "#f59e0b" : "var(--q)");
        dial.set(l.percent, Math.round(l.percent), "%", pace == null ? void 0 : pace.elapsed);
        label.textContent = `${st.logo} ${p.name} \xB7 ${l.label}`;
        sub.textContent = l.resetsAt ? "resets in " + fmtDur(l.resetsAt - Date.now()) : "";
        sub.className = "g-sub " + ((pace == null ? void 0 : pace.cls) === "over" ? "hot" : "");
      };
      return { update(kind) {
        if (kind === "tick" && Date.now() - last < 3e4) return;
        last = Date.now();
        render();
      } };
    }
  };
  W.volume = {
    needs: ["state"],
    create(box) {
      const fill = h("i"), bar = h("div", "vb", fill), pct = h("div", "vb-v", "--");
      const mute = h("button", "pb", "\u{1F507}"), down = h("button", "pb", "\u2212"), up = h("button", "pb", "+");
      box.append(h("div", "w-title", "Volume"), h("div", "vb-row", bar, pct), h("div", "pomo-btns", mute, down, up));
      let dragging = false, timer = 0, level = 0;
      const vertical = () => box.clientHeight > box.clientWidth * 1.15;
      const paint = (v, muted) => {
        level = v;
        box.classList.toggle("vert", vertical());
        fill.style[vertical() ? "height" : "width"] = v + "%";
        fill.style[vertical() ? "width" : "height"] = "100%";
        pct.textContent = muted ? "muted" : v + "%";
        box.classList.toggle("muted", !!muted);
      };
      const fromPointer = (e) => {
        var _a;
        if (!((_a = D.state) == null ? void 0 : _a.audio) || D.state.audio.canControl === false) return;
        const r = bar.getBoundingClientRect();
        const f = vertical() ? 1 - (e.clientY - r.top) / r.height : (e.clientX - r.left) / r.width;
        const v = Math.round(Math.max(0, Math.min(1, f)) * 100);
        paint(v, false);
        clearTimeout(timer);
        timer = setTimeout(() => api("/volume?level=" + v, "POST").catch(() => {
        }), 80);
      };
      bar.addEventListener("pointerdown", (e) => {
        dragging = true;
        bar.setPointerCapture(e.pointerId);
        fromPointer(e);
      });
      bar.addEventListener("pointermove", (e) => {
        if (dragging) fromPointer(e);
      });
      bar.addEventListener("pointerup", () => setTimeout(() => dragging = false, 400));
      const op = (q) => () => __async(this, null, function* () {
        haptic();
        try {
          const a = yield api("/volume?" + q, "POST");
          paint(a.volume, a.muted);
        } catch (_) {
        }
      });
      mute.addEventListener("click", op("op=mute"));
      down.addEventListener("click", op("op=down"));
      up.addEventListener("click", op("op=up"));
      return { update() {
        var _a;
        const a = (_a = D.state) == null ? void 0 : _a.audio;
        box.classList.toggle("unavailable", !a || a.canControl === false);
        mute.disabled = down.disabled = up.disabled = !a || a.canControl === false;
        if (a && !dragging) paint(a.volume, a.muted);
        else if (!a) {
          pct.textContent = "n/a";
          fill.style.width = fill.style.height = "0";
        }
      } };
    }
  };
  var RULE_WHEN = {
    "session-waiting": "\u2733\uFE0F",
    "session-busy": "\u2699\uFE0F",
    "media-playing": "\u{1F3B5}",
    "process-running": "\u{1FA9F}",
    "mic-in-use": "\u{1F399}\uFE0F",
    "camera-in-use": "\u{1F4F7}",
    "obs-live": "\u{1F534}",
    "calendar-event": "\u{1F4C6}",
    "cpu-above": "\u{1F525}",
    idle: "\u{1F319}",
    time: "\u{1F559}",
    push: "\u{1F4E1}",
    "quota-above": "\u{1F3AF}",
    "review-requested": "\u{1F440}",
    "ci-failed": "\u274C",
    "battery-low": "\u{1F50B}",
    "ping-high": "\u{1F4F6}",
    always: "\u{1F4C5}"
  };
  W.rules = {
    needs: ["state"],
    create(box, { o }) {
      const list = h("div", "ru-list"), btn = h("button", "ru-pause");
      box.append(h("div", "w-title", o.title || t("s.nav.rules"), btn), list);
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleRulesPause();
      });
      let key = "";
      return {
        update() {
          var _a;
          const rules = (cfg.rules || []).filter((r) => r.enabled !== false);
          const active = ((_a = D.state) == null ? void 0 : _a.rules) || [];
          const paused = rulesPaused && rulesPaused > Date.now();
          const k = JSON.stringify([rules, active, paused]);
          if (k === key) return;
          key = k;
          btn.textContent = paused ? "\u25B6 Resume" : "\u23F8 Pause";
          btn.hidden = !D.state;
          box.classList.toggle("paused", !!paused);
          if (!rules.length) {
            list.replaceChildren(h("div", "empty", "Add rules in Settings \u203A Rules"));
            return;
          }
          const sorted = [...rules].sort((a, b) => active.includes(b.id) - active.includes(a.id));
          list.replaceChildren(
            ...paused ? [h("div", "ru-note", `Paused until ${fmtHM(new Date(rulesPaused))}`)] : [],
            ...sorted.map((r) => h(
              "div",
              "ru-row" + (active.includes(r.id) && !paused ? " on" : ""),
              h("span", "ru-ico", RULE_WHEN[r.when] || "\u26A1"),
              h("span", "ru-name", r.name || r.when),
              h("i", "ru-dot")
            ))
          );
        }
      };
    }
  };
  W.chargecare = {
    needs: ["tick"],
    create(box) {
      const C = 2 * Math.PI * 42;
      box.innerHTML = '<div class="w-title">Battery care</div><div class="cc-body"><div class="cc-wrap"><svg viewBox="0 0 100 100" class="cc-ring"><circle class="cc-bg" cx="50" cy="50" r="42"/><circle class="cc-band" cx="50" cy="50" r="42"/><circle class="cc-fg" cx="50" cy="50" r="42"/></svg><b class="cc-pct">\u2014</b></div></div><div class="cc-sub"><span class="cc-state"></span> <span class="cc-text"></span></div>';
      const q = (s) => box.querySelector(s);
      const load = every(15e3, () => {
        var _a, _b, _c;
        const ch = cfg.charge || {};
        const min = (_a = ch.min) != null ? _a : 50, max = (_b = ch.max) != null ? _b : 80;
        const band = q(".cc-band");
        band.style.strokeDasharray = `${C * (max - min) / 100} ${C}`;
        band.style.strokeDashoffset = String(-C * min / 100);
        band.style.opacity = ch.enabled ? "" : "0";
        if (!((_c = bridge) == null ? void 0 : _c.battery)) {
          q(".cc-pct").textContent = "\u2014";
          q(".cc-text").textContent = "Only on the phone";
          return;
        }
        let b;
        try {
          b = JSON.parse(bridge.battery());
        } catch (_) {
          return;
        }
        if (!(b.level >= 0)) return;
        q(".cc-fg").style.strokeDasharray = `${C * b.level / 100} ${C}`;
        q(".cc-pct").textContent = b.level + "%";
        q(".cc-state").textContent = b.plugged ? "\u26A1" : "\u{1F50B}";
        const col = b.level <= 20 ? "#ef4444" : ch.enabled && b.level > max ? "#f59e0b" : b.plugged ? "#22c55e" : "rgb(var(--ambient))";
        box.style.setProperty("--cc", col);
        q(".cc-text").textContent = !ch.enabled ? `Battery care is off${b.temp ? ` \xB7 ${b.temp.toFixed(0)} \xB0C` : ""}` : b.plugged ? `Charges up to ${max}%` + (b.level >= max ? " \xB7 power off soon" : "") : `Charges again at ${min}%`;
      });
      return { update: load };
    }
  };
  W.nextup = {
    needs: ["calendar", "tick"],
    create(box, { o }) {
      const only = String(o.calendars || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
      const when = h("div", "nu-when"), title = h("div", "nu-title"), meta = h("div", "nu-meta"), bar = h("i"), track = h("div", "track nu-track", bar);
      box.append(h("div", "w-title", o.title || "Next up"), when, title, meta, track);
      let key = "";
      const hm = (ms) => fmtHM(new Date(ms));
      return {
        update() {
          const cal = D.calendar, now = Date.now();
          const evs = ((cal == null ? void 0 : cal.events) || []).filter((e) => !e.allDay && e.end > now && (!only.length || only.includes(e.calendar.toLowerCase()))).sort((a, b) => a.start - b.start);
          const cur = evs.find((e) => e.start <= now), next = evs.find((e) => e.start > now);
          const ev = cur || next;
          const k = JSON.stringify([ev == null ? void 0 : ev.start, ev == null ? void 0 : ev.title, Math.floor(now / 15e3), !!cal]);
          if (k === key) return;
          key = k;
          box.classList.toggle("now", !!cur);
          track.hidden = !cur;
          if (!ev) {
            when.textContent = "";
            meta.textContent = "";
            title.textContent = !cal ? t("w.loading") : cal.updated || evs.length ? t("w.noEvents") : "Add a calendar in Settings \u203A General";
            return;
          }
          const left = Math.round(((cur ? ev.end : ev.start) - now) / 6e4);
          const dur = left < 60 ? t("time.min", { m: Math.max(1, left) }) : fmtDur((cur ? ev.end : ev.start) - now);
          const sameDay = new Date(ev.start).toDateString() === (/* @__PURE__ */ new Date()).toDateString();
          when.textContent = cur ? t("w.nowLeft", { dur }) : sameDay || left < 12 * 60 ? t("time.inDur", { dur }) : new Date(ev.start).toLocaleDateString(LOCALE, { weekday: "long" });
          title.textContent = ev.title;
          meta.textContent = [`${hm(ev.start)}\u2013${hm(ev.end)}`, ev.location, cur && next ? `then ${next.title} at ${hm(next.start)}` : ""].filter(Boolean).join(" \xB7 ");
          if (cur) bar.style.width = Math.min(100, (now - ev.start) / (ev.end - ev.start) * 100) + "%";
          box.style.setProperty("--nu", ev.color || "rgb(var(--ambient))");
        }
      };
    }
  };
  var GPU_VENDOR = { nvidia: "NVIDIA", amd: "AMD", intel: "Intel", apple: "Apple", qualcomm: "Qualcomm" };
  var GPU_SOURCE = { "nvidia-smi": "nvidia-smi", lhm: "LibreHardwareMonitor", windows: "Windows", sysfs: "sysfs", ioreg: "ioreg" };
  W.gpu = {
    needs: ["state"],
    create(box, { o }) {
      const idx = Math.max(0, Math.min(3, Number(o.adapter) || 0));
      box.style.setProperty("--c", cssVar("--gpu"));
      const label = h("span", "s-label", "GPU"), name = h("span", "s-name");
      const big = h("div", "gd-big"), rows = h("div", "meters gd-rows"), chips = h("div", "chips gd-chips");
      box.append(h("div", "s-head", label, name), big, rows, chips);
      const meter2 = (title, txt, pct, c) => {
        const e = h("div", "meter", h("div", "m-row", h("span", null, title), h("span", null, txt)), h("div", "track", h("i")));
        e.querySelector("i").style.width = Math.max(0, Math.min(100, pct || 0)) + "%";
        if (c) e.style.setProperty("--c", c);
        return e;
      };
      const heat = (t2, max) => t2 >= max - 5 ? "#ef4444" : t2 >= max - 15 ? "#f59e0b" : "#f97316";
      return {
        update() {
          var _a, _b;
          const g = gpusOf(D.state)[idx];
          if (!g) {
            label.textContent = "GPU";
            name.textContent = "";
            big.replaceChildren(h("div", "empty", !D.state ? "Waiting\u2026" : idx ? "No second GPU" : "No GPU data"));
            rows.replaceChildren();
            chips.replaceChildren();
            return;
          }
          label.textContent = (GPU_VENDOR[g.vendor] || "GPU") + (g.integrated ? " \xB7 iGPU" : "");
          name.textContent = shortGpu(g.name);
          name.title = g.name;
          const temps = [
            g.temp != null ? `${Math.round(g.temp)}\xB0C` : null,
            g.hotSpot != null ? `hot spot ${Math.round(g.hotSpot)}\xB0` : null,
            g.memTemp != null ? `memory ${Math.round(g.memTemp)}\xB0` : null
          ].filter(Boolean).join(" \xB7 ");
          big.replaceChildren(h("b", null, g.util != null ? String(Math.round(g.util)) : "\u2014"), h("small", null, "% load"), h("span", "gd-temp", temps));
          const list = [];
          const mem = gpuMem(g);
          if (mem) list.push(meter2(mem.label === "VRAM" ? "VRAM" : "GPU memory", `${r1(mem.used)} / ${Math.round(mem.total)} GB`, mem.used / mem.total * 100));
          if (!g.integrated && g.sharedTotal && g.sharedUsed != null) list.push(meter2("Shared memory", `${r1(g.sharedUsed)} GB`, g.sharedUsed / g.sharedTotal * 100, "#64748b"));
          if (g.power != null) {
            list.push(meter2(
              "Power",
              g.powerLimit ? `${Math.round(g.power)} / ${Math.round(g.powerLimit)} W` : `${Math.round(g.power)} W`,
              g.powerLimit ? g.power / g.powerLimit * 100 : g.powerPct,
              "#facc15"
            ));
          } else if (g.powerPct != null) list.push(meter2("Power", `${Math.round(g.powerPct)}% of limit`, g.powerPct, "#facc15"));
          const hottest = Math.max((_a = g.temp) != null ? _a : -1, (_b = g.hotSpot) != null ? _b : -1);
          if (hottest >= 0) {
            const max = g.tempMax || (g.hotSpot != null ? 110 : 100);
            list.push(meter2("Temperature", `${Math.round(hottest)} / ${Math.round(max)}\xB0C`, hottest / max * 100, heat(hottest, max)));
          }
          rows.replaceChildren(...list);
          chips.replaceChildren(...[
            g.clock != null ? `Core ${Math.round(g.clock)} MHz` : null,
            g.memClock != null ? `Memory ${Math.round(g.memClock)} MHz` : null,
            g.fan != null || g.fanRpm != null ? `Fan ${[g.fan != null ? Math.round(g.fan) + "%" : null, g.fanRpm != null ? Math.round(g.fanRpm) + " rpm" : null].filter(Boolean).join(" \xB7 ")}` : null,
            g.driver ? `Driver ${g.driver}` : null,
            g.source ? g.source.split("+").map((x) => GPU_SOURCE[x] || x).join(" + ") : null
          ].filter(Boolean).map((t2) => h("span", "chip", t2)));
        }
      };
    }
  };

  // ../../../tmp/claude-0/-home-claude/d7433526-111a-5017-bcc4-3fd104415c33/scratchpad/pb/src/android/app/src/main/assets/www/widgets/sky.js
  function moonPhase(date) {
    const syn = 29.530588853;
    const age = ((date - Date.UTC(2e3, 0, 6, 18, 14)) / 864e5 % syn + syn) % syn;
    const names = ["New moon", "Waxing crescent", "First quarter", "Waxing gibbous", "Full moon", "Waning gibbous", "Last quarter", "Waning crescent"];
    const i = Math.floor((age + syn / 16) % syn / (syn / 8));
    return { name: names[i], icon: "\u{1F311}\u{1F312}\u{1F313}\u{1F314}\u{1F315}\u{1F316}\u{1F317}\u{1F318}".match(/./gu)[i], illum: (1 - Math.cos(2 * Math.PI * age / syn)) / 2 };
  }
  W.sun = {
    needs: ["weather", "tick"],
    create(box) {
      box.innerHTML = '<div class="w-title">Sun &amp; moon<span class="w-sub"></span></div><svg class="sun-arc" viewBox="0 0 200 80" preserveAspectRatio="xMidYMax meet"><path class="sa-bg" d="M10 75 A90 70 0 0 1 190 75"/><path class="sa-fg" d="M10 75 A90 70 0 0 1 190 75"/><line class="sa-h" x1="2" y1="75" x2="198" y2="75"/><circle class="sa-sun" r="7" cx="10" cy="75"/></svg><div class="sun-row"><span class="sr"></span><span class="sl"></span><span class="ss"></span></div><div class="moon"></div>';
      const q = (s) => box.querySelector(s);
      const fg = q(".sa-fg"), sun = q(".sa-sun");
      const len = fg.getTotalLength();
      fg.style.strokeDasharray = len;
      let shown = "";
      return {
        update() {
          var _a, _b, _c, _d;
          const d = (_a = D.weather) == null ? void 0 : _a.daily;
          if (!(d == null ? void 0 : d.sunrise)) {
            q(".sl").textContent = D.weather === null ? t("w.loading") : t("w.weatherUnavailable");
            return;
          }
          const now = /* @__PURE__ */ new Date();
          const key = now.getHours() + ":" + now.getMinutes();
          if (key === shown) return;
          shown = key;
          const rise = new Date(d.sunrise[0]), set = new Date(d.sunset[0]);
          const f = Math.max(0, Math.min(1, (now - rise) / (set - rise)));
          fg.style.strokeDashoffset = len * (1 - f);
          const pt = fg.getPointAtLength(len * f);
          sun.setAttribute("cx", pt.x.toFixed(1));
          sun.setAttribute("cy", pt.y.toFixed(1));
          box.classList.toggle("night", now < rise || now > set);
          const hm = fmtHM;
          q(".sr").textContent = "\u2191 " + hm(rise);
          q(".ss").textContent = hm(set) + " \u2193";
          q(".sl").textContent = now < rise ? t("w.risesIn", { dur: fmtDur(rise - now) }) : now > set ? t("w.afterSunset") : t("w.lightLeft", { dur: fmtDur(set - now) });
          q(".w-sub").textContent = t("w.day") + " " + fmtDur(((_c = (_b = d.daylight_duration) == null ? void 0 : _b[0]) != null ? _c : (set - rise) / 1e3) * 1e3) + (((_d = d.uv_index_max) == null ? void 0 : _d[0]) != null ? ` \xB7 UV ${Math.round(d.uv_index_max[0])}` : "");
          const m = moonPhase(now);
          q(".moon").textContent = `${m.icon} ${m.name} \xB7 ${Math.round(m.illum * 100)}%`;
        }
      };
    }
  };
  var AQI_BANDS = [[20, "Good", "#22c55e"], [40, "Fair", "#84cc16"], [60, "Moderate", "#eab308"], [80, "Poor", "#f97316"], [100, "Very poor", "#ef4444"], [1e9, "Extremely poor", "#a855f7"]];
  W.air = {
    needs: ["tick"],
    create(box) {
      const city = h("span", "w-sub");
      const v = h("div", "aq-v", "\u2014"), cat = h("div", "aq-c", t("w.loading")), chips = h("div", "aq-chips");
      box.append(h("div", "w-title", "Air quality", city), h("div", "aq-main", v, cat), chips);
      let coordinates, load;
      const clearIndex = (message) => {
        box.style.removeProperty("--c");
        v.textContent = "\u2014";
        cat.textContent = message;
      };
      function loader(lat, lon, location2) {
        return every(30 * 6e4, () => __async(this, null, function* () {
          try {
            const d = yield cached(`air:${location2}`, `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi,pm2_5,pm10,ozone,nitrogen_dioxide&timezone=auto`, 30 * 6e4);
            if (coordinates !== location2) return;
            const c = d.current || {};
            const aqi = c.european_aqi;
            const band = Number.isFinite(aqi) && aqi >= 0 ? AQI_BANDS.find((b) => aqi <= b[0]) : null;
            if (band) {
              box.style.setProperty("--c", band[2]);
              v.textContent = Math.round(aqi);
              cat.textContent = band[1] + " \xB7 " + t("w.euroAqi");
            } else clearIndex(t("w.unavailable"));
            chips.replaceChildren(...[["PM2.5", c.pm2_5], ["PM10", c.pm10], ["O\u2083", c.ozone], ["NO\u2082", c.nitrogen_dioxide]].filter((x) => x[1] != null).map(([n, x]) => h("span", "chip", `${n} ${Math.round(x)}`)));
          } catch (_) {
            if (coordinates === location2) cat.textContent = t("w.unavailable");
            return false;
          }
        }));
      }
      return {
        update() {
          const { city: name, lat, lon } = cfg.weather || DEFAULT_CFG.weather;
          if (city.textContent !== (name || "")) city.textContent = name || "";
          const location2 = `${lat},${lon}`;
          if (coordinates !== location2) {
            coordinates = location2;
            clearIndex(t("w.loading"));
            chips.replaceChildren();
            load = loader(lat, lon, location2);
          }
          load();
        }
      };
    }
  };
  W.moon = {
    needs: ["tick"],
    create(box) {
      box.innerHTML = '<div class="w-title">Moon</div><div class="mo-body"><svg viewBox="0 0 100 100" class="mo-disc"><circle class="mo-dark" cx="50" cy="50" r="44"/><path class="mo-lit"/></svg><div class="mo-text"><b class="mo-name"></b><span class="mo-ill"></span><small class="mo-next"></small></div></div>';
      const q = (s) => box.querySelector(s);
      let shown = -1;
      return {
        update() {
          const now = /* @__PURE__ */ new Date();
          const hour = Math.floor(now / 36e5);
          if (hour === shown) return;
          shown = hour;
          const syn = 29.530588853;
          const age = ((now - Date.UTC(2e3, 0, 6, 18, 14)) / 864e5 % syn + syn) % syn;
          const m = moonPhase(now);
          const r = 44, rx = Math.abs(Math.cos(2 * Math.PI * age / syn)) * r;
          const waxing = age < syn / 2, gibbous = m.illum > 0.5;
          const d = waxing ? `M50 6 A${r} ${r} 0 0 1 50 94 A${rx.toFixed(2)} ${r} 0 0 ${gibbous ? 1 : 0} 50 6Z` : `M50 6 A${r} ${r} 0 0 0 50 94 A${rx.toFixed(2)} ${r} 0 0 ${gibbous ? 0 : 1} 50 6Z`;
          q(".mo-lit").setAttribute("d", d);
          q(".mo-name").textContent = m.name;
          q(".mo-ill").textContent = `${Math.round(m.illum * 100)}% lit`;
          const inDays = (target) => {
            const dd = ((target - age) % syn + syn) % syn;
            return dd < 0.5 ? "tonight" : dd < 1.5 ? "tomorrow" : `in ${Math.round(dd)} days`;
          };
          q(".mo-next").textContent = age < syn / 2 ? `Full moon ${inDays(syn / 2)}` : `New moon ${inDays(syn)}`;
        }
      };
    }
  };

  // ../../../tmp/claude-0/-home-claude/d7433526-111a-5017-bcc4-3fd104415c33/scratchpad/pb/src/android/app/src/main/assets/www/widgets/web.js
  W.hackernews = {
    needs: ["tick"],
    create(box) {
      const list = h("div", "hn-list", h("div", "empty", t("w.loading")));
      box.style.setProperty("--c", "#ff6600");
      box.append(h("div", "w-title", "Hacker News", h("span", "w-sub", "")), list);
      const load = every(15 * 6e4, () => __async(this, null, function* () {
        try {
          const key = "hn";
          let data = store.get("nc:" + key, null);
          if (!data || Date.now() - data.at > 15 * 6e4) {
            const ids = (yield cached("hn-ids", "https://hacker-news.firebaseio.com/v0/topstories.json", 15 * 6e4)).slice(0, 15);
            const items = yield Promise.all(ids.map((id) => safeFetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then((r) => r.json()).catch(() => null)));
            data = { at: Date.now(), data: items.filter(Boolean).map((i) => ({ t: i.title, u: i.url, s: i.score, c: i.descendants || 0 })) };
            store.set("nc:" + key, data);
          }
          box.querySelector(".w-sub").textContent = ago(data.at);
          const n = Math.max(1, Math.floor((box.clientHeight - 30) / 33));
          list.replaceChildren(...data.data.slice(0, n).map((s, i) => {
            let host = "";
            try {
              host = s.u ? new URL(s.u).hostname.replace(/^www\./, "") : "news.ycombinator.com";
            } catch (_) {
            }
            return h("div", "hn-i", h("span", "hn-r", i + 1), h("div", "hn-b", h("div", "hn-t", s.t), h("div", "hn-m", `\u25B2 ${s.s} \xB7 ${s.c} comments \xB7 ${host}`)));
          }));
        } catch (_) {
          if (!list.querySelector(".hn-i")) list.replaceChildren(h("div", "empty", t("w.offline")));
          return false;
        }
      }));
      return { update: load };
    }
  };
  W.feeds = {
    needs: ["tick"],
    create(box, { o }) {
      const only = String(o.feed || "").trim().toLowerCase();
      const showSource = o.showSource !== false, showTime = o.showTime !== false;
      const list = h("div", "fd-list", h("div", "empty", t("w.loading")));
      const sub = h("span", "w-sub", "");
      box.style.setProperty("--c", "#f59e0b");
      if (o.title !== "") box.append(h("div", "w-title", o.title || "News", sub));
      box.append(list);
      let data = null, lastKey = "", busy = null;
      const open = (it) => __async(this, null, function* () {
        if (!it.openable || busy) return;
        if (o.open !== true || !(data == null ? void 0 : data.canOpen)) {
          toast(t("w.feeds.openOff"), "err");
          return;
        }
        haptic();
        busy = it.id;
        const ctl = new AbortController();
        const timer = setTimeout(() => ctl.abort(), 8e3);
        try {
          const r = yield fetch(`${API}/feeds/open?id=${encodeURIComponent(it.id)}`, { method: "POST", cache: "no-store", headers: PANEL_HEADERS, signal: ctl.signal });
          const j = yield r.json().catch(() => ({}));
          if (r.ok) toast(t("w.feeds.opening"), "ok");
          else toast(j.error || t("w.feeds.openFailed"), "err");
        } catch (_) {
          toast(t("panel.pcNoAnswer"), "err");
        } finally {
          clearTimeout(timer);
          busy = null;
        }
      });
      const render = () => {
        const items = ((data == null ? void 0 : data.items) || []).filter((i) => !only || i.source.toLowerCase() === only);
        const rows = Math.max(1, Math.floor((box.clientHeight - (o.title !== "" ? 30 : 6)) / 33));
        const key = JSON.stringify([!!data, data == null ? void 0 : data.canOpen, items.slice(0, rows).map((i) => i.id), data == null ? void 0 : data.errors, rows, Math.floor(Date.now() / 6e4)]);
        if (key === lastKey) return;
        lastKey = key;
        const err = ((data == null ? void 0 : data.errors) || []).filter((e) => !only || e.toLowerCase().startsWith(only + ":"));
        sub.textContent = err.length ? "\u26A0" : "";
        sub.title = err.join("\n");
        if (!data) return;
        if (!items.length) {
          list.replaceChildren(h("div", "empty", err.length ? err[0] : data.updated && (data.items || []).length ? t("w.feeds.noneFrom", { name: o.feed }) : t("w.feeds.addInSettings")));
          return;
        }
        list.replaceChildren(...items.slice(0, rows).map((it) => {
          const meta = [showSource ? it.source : "", showTime && it.published ? ago(it.published) : ""].filter(Boolean).join(" \xB7 ");
          const row = h("div", "fd-i" + (it.openable && o.open === true && data.canOpen ? " link" : ""), h("div", "fd-t", it.title), meta ? h("div", "fd-m", meta) : null);
          row.onclick = () => open(it);
          return row;
        }));
      };
      const load = every(6e4, () => __async(this, null, function* () {
        try {
          data = yield api("/feeds", "GET", 5e3);
          lastKey = "";
          render();
        } catch (_) {
          if (!data) list.replaceChildren(h("div", "empty", t("w.offline")));
          return false;
        }
      }));
      return { update() {
        load();
        render();
      } };
    }
  };
  W.exchange = {
    needs: ["tick"],
    create(box, { o }) {
      const base = (o.base || "EUR").toUpperCase();
      const syms = lines(o.symbols, ["TRY", "USD", "GBP"]).map((s) => s.toUpperCase()).slice(0, 8);
      const list = h("div", "fx-list", h("div", "empty", t("w.loading")));
      box.append(h("div", "w-title", `1 ${base}`, h("span", "w-sub", "")), list);
      const load = every(60 * 6e4, () => __async(this, null, function* () {
        try {
          const from = new Date(Date.now() - 31 * 864e5).toISOString().slice(0, 10);
          const d = yield cached(`fx:${base}:${syms}`, `https://api.frankfurter.dev/v1/${from}..?base=${base}&symbols=${syms.join(",")}`, 60 * 6e4);
          const days = Object.keys(d.rates || {}).sort();
          if (!days.length) {
            box.querySelector(".w-sub").textContent = "";
            list.replaceChildren(h("div", "empty", t("w.ratesUnavailable")));
            return false;
          }
          box.querySelector(".w-sub").textContent = "ECB \xB7 " + days[days.length - 1];
          list.replaceChildren(...syms.map((s) => {
            const series = days.map((k) => {
              var _a;
              return (_a = d.rates[k]) == null ? void 0 : _a[s];
            }).filter((v) => Number.isFinite(v) && v > 0);
            const last = series[series.length - 1], prev = series[series.length - 2];
            const change = prev === void 0 ? h("span", "chg", "\u2014") : pctSpan((last - prev) / prev * 100);
            const c = h("canvas", "fx-sp");
            const row = h("div", "fx-i", h("b", null, s), h("span", "fx-v", fmtNum(last)), change, c);
            requestAnimationFrame(() => sparkLine(c, series, last >= series[0] ? "#22c55e" : "#ef4444"));
            return row;
          }));
        } catch (_) {
          list.replaceChildren(h("div", "empty", t("w.ratesUnavailable")));
          return false;
        }
      }));
      return { update: load };
    }
  };
  W.crypto = {
    needs: ["tick"],
    create(box, { o }) {
      const coins = lines(o.coins, ["bitcoin", "ethereum", "solana"]).map((s) => s.toLowerCase()).slice(0, 8);
      const cur = (o.currency || "usd").toLowerCase();
      const list = h("div", "fx-list", h("div", "empty", t("w.loading")));
      box.append(h("div", "w-title", "Crypto", h("span", "w-sub", cur.toUpperCase() + " \xB7 24 h \xB7 7 d")), list);
      const load = every(5 * 6e4, () => __async(this, null, function* () {
        try {
          const d = yield cached(`cg:${cur}:${coins}`, `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${cur}&ids=${coins.join(",")}&sparkline=true&price_change_percentage=24h`, 5 * 6e4);
          list.replaceChildren(...d.map((c) => {
            var _a, _b;
            const cv = h("canvas", "fx-sp");
            const series = ((_a = c.sparkline_in_7d) == null ? void 0 : _a.price) || [];
            requestAnimationFrame(() => {
              var _a2;
              return sparkLine(cv, series, ((_a2 = c.price_change_percentage_24h) != null ? _a2 : 0) >= 0 ? "#22c55e" : "#ef4444");
            });
            return h("div", "fx-i", h("b", null, (c.symbol || "").toUpperCase()), h("span", "fx-v", fmtNum(c.current_price)), pctSpan((_b = c.price_change_percentage_24h) != null ? _b : 0), cv);
          }));
        } catch (_) {
          list.replaceChildren(h("div", "empty", t("w.pricesUnavailable")));
          return false;
        }
      }));
      return { update: load };
    }
  };
  W.image = {
    needs: ["tick"],
    create(box, { o }) {
      const url = String(o.url || "");
      const img = h("img", "im-img");
      img.alt = "";
      img.style.objectFit = o.fit === "contain" ? "contain" : "cover";
      box.append(img);
      if (o.caption) box.append(h("div", "im-cap", o.caption));
      if (!/^https?:\/\//i.test(url)) {
        box.replaceChildren(h("div", "empty", t("w.setImageUrl")));
        return {};
      }
      img.onerror = () => box.classList.add("err");
      img.onload = () => box.classList.remove("err");
      const mins = Number(o.minutes) || 0;
      const load = every(mins > 0 ? mins * 6e4 : 1e12, () => {
        img.src = mins > 0 ? url + (url.includes("?") ? "&" : "?") + "_t=" + Date.now() : url;
      });
      return { update: load };
    }
  };

  // ../../../tmp/claude-0/-home-claude/d7433526-111a-5017-bcc4-3fd104415c33/scratchpad/pb/src/android/app/src/main/assets/www/widgets/photos.js
  W.photos = {
    needs: ["tick"],
    create(box, { o, page }) {
      const every2 = Math.max(5, Math.min(3600, +o.interval || 30)) * 1e3;
      const fit = o.fit === "contain" ? "contain" : "cover";
      box.classList.add("pf");
      const layers = [h("img", "pf-img"), h("img", "pf-img")];
      for (const img of layers) {
        img.alt = "";
        img.decoding = "async";
        img.style.objectFit = fit;
      }
      const note = h("div", "empty pf-note", t("w.loading"));
      box.append(...layers, note);
      let ids = [], order = [], pos = 0, listAt = 0, nextAt = 0, front = 0, alive = true;
      let inflight2 = null, shown = null;
      const urls = /* @__PURE__ */ new Set();
      const visible = () => !document.body.classList.contains("night") && pages[curPage] === page && !box.closest(".stack-item:not(.active)");
      const say = (text) => {
        note.textContent = text || "";
        note.hidden = !text;
      };
      const shuffle = (a) => {
        for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
      };
      const reorder = () => {
        order = o.shuffle === false ? [...ids] : shuffle([...ids]);
        pos = 0;
      };
      const loadList = () => __async(this, null, function* () {
        listAt = Date.now();
        try {
          const r = yield api("/photos", "GET", 1e4);
          if (!alive) return;
          if (r.scanning) {
            listAt = Date.now() - 9 * 6e4;
            say(t("w.loading"));
            return;
          }
          const list = Array.isArray(r.ids) ? r.ids : [];
          const same = list.length === ids.length && list.every((id, i) => id === ids[i]);
          ids = list;
          if (!same) reorder();
          if (!ids.length) say(r.error || t("w.photos.setUp"));
        } catch (_) {
          listAt = Date.now() - 9 * 6e4;
          if (!shown) say(t("w.offline"));
        }
      });
      const showNext = () => __async(this, null, function* () {
        if (inflight2 || !order.length) return;
        const id = order[pos];
        pos = (pos + 1) % order.length;
        if (pos === 0 && o.shuffle !== false) reorder();
        const ctl = new AbortController();
        const timer = setTimeout(() => ctl.abort(), 2e4);
        let late;
        const deadline = new Promise((_, fail2) => {
          late = setTimeout(() => fail2(new Error("timeout")), 2e4);
        });
        deadline.catch(() => {
        });
        inflight2 = ctl;
        try {
          const r = yield Promise.race([fetch(`${API}/photos/${encodeURIComponent(id)}`, { cache: "no-store", headers: PANEL_HEADERS, signal: ctl.signal }), deadline]);
          if (!r.ok) throw new Error("HTTP " + r.status);
          const url = URL.createObjectURL(yield Promise.race([r.blob(), deadline]));
          if (!alive) {
            URL.revokeObjectURL(url);
            return;
          }
          urls.add(url);
          const next = layers[1 - front], prev = layers[front];
          const ok = yield new Promise((done) => {
            next.onload = () => done(true);
            next.onerror = () => done(false);
            ctl.signal.addEventListener("abort", () => done(false));
            next.src = url;
          });
          next.onload = next.onerror = null;
          if (!ok || !alive || !visible()) {
            if (next.src === url) next.removeAttribute("src");
            URL.revokeObjectURL(url);
            urls.delete(url);
            if (!ok) nextAt = Date.now() + 5e3;
            return;
          }
          next.classList.add("on");
          prev.classList.remove("on");
          front = 1 - front;
          say("");
          const old = shown;
          shown = url;
          if (old) setTimeout(() => {
            URL.revokeObjectURL(old);
            urls.delete(old);
          }, 1200);
        } catch (_) {
          nextAt = Date.now() + 5e3;
        } finally {
          clearTimeout(timer);
          clearTimeout(late);
          inflight2 = null;
        }
      });
      return {
        update() {
          if (!alive || !visible()) return;
          const now = Date.now();
          if (!listAt || now - listAt > 10 * 6e4) loadList();
          if (order.length && now >= nextAt) {
            nextAt = now + every2;
            showNext();
          }
        },
        destroy() {
          alive = false;
          if (inflight2) inflight2.abort();
          for (const u of urls) URL.revokeObjectURL(u);
          urls.clear();
        }
      };
    }
  };

  // ../../../tmp/claude-0/-home-claude/d7433526-111a-5017-bcc4-3fd104415c33/scratchpad/pb/src/android/app/src/main/assets/www/widgets/console.js
  var STEP_DEG = 24;
  function post(path) {
    return __async(this, null, function* () {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 2e4);
      try {
        const r = yield fetch(API + path, { method: "POST", cache: "no-store", headers: PANEL_HEADERS, signal: ctl.signal });
        if (r.ok) return;
        let error = "HTTP " + r.status;
        try {
          error = (yield r.json()).error || error;
        } catch (_) {
        }
        throw new Error(error);
      } finally {
        clearTimeout(timer);
      }
    });
  }
  W["app-console"] = {
    needs: ["tick"],
    create(box, { o, page, w }) {
      box.classList.add("ac");
      const wq = "widget=" + encodeURIComponent(`${page.id}/${w.id}`);
      const title = h("div", "ac-title");
      const keys = h("div", "ac-keys");
      const knob = h("div", "ac-knob");
      const dial = h("div", "ac-dial", knob);
      const note = h("div", "empty ac-note", t("w.loading"));
      box.append(title, keys, dial, note);
      let alive = true, polling = false, lastPoll = 0, profile = null, sig = "", missing = false;
      let angle = 0, turned = 0, moved = 0, pending2 = 0, sending = false;
      const fail2 = (e) => {
        toast((e == null ? void 0 : e.message) || t("w.offline"), "err");
        sig = "";
        lastPoll = 0;
      };
      const say = (text) => {
        note.textContent = text || "";
        note.hidden = !text;
      };
      const render = (state) => {
        if ((state && state.profile && state.profile.id) !== (profile && profile.id)) {
          pending2 = 0;
          turned = 0;
          start = null;
          onKnob = false;
        }
        profile = state && state.profile;
        const s = JSON.stringify(state || null);
        if (s === sig) return;
        sig = s;
        const usable = !!(profile && state.control && o.control === true);
        title.textContent = profile ? profile.label : "";
        keys.replaceChildren(...(profile ? profile.keys : []).map((label, i) => {
          const b = h("button", "ac-key", label);
          b.disabled = !usable;
          b.onclick = () => {
            haptic();
            post(`/console/${encodeURIComponent(profile.id)}/k${i}?${wq}`).catch(fail2);
          };
          return b;
        }));
        const d = profile && profile.dial;
        dial.hidden = !(usable && o.dial !== false && d && (d.left || d.right || d.press));
        box.classList.toggle("ac-has-dial", !dial.hidden);
        if (!state) say(t(missing ? "w.console.unavailable" : "w.offline"));
        else if (!state.supported) say(t("w.console.windowsOnly"));
        else if (!profile) say(t("w.console.noProfile"));
        else if (!state.control || o.control !== true) say(t("w.console.controlOff"));
        else say("");
      };
      const poll2 = () => __async(this, null, function* () {
        if (polling) return;
        polling = true;
        lastPoll = Date.now();
        try {
          const ctl = new AbortController();
          const timer = setTimeout(() => ctl.abort(), 4e3);
          try {
            const r = yield fetch(`${API}/console?${wq}`, { cache: "no-store", headers: PANEL_HEADERS, signal: ctl.signal });
            if (!alive) return;
            missing = r.status === 404;
            render(r.ok ? yield r.json() : null);
          } finally {
            clearTimeout(timer);
          }
        } catch (_) {
          if (alive) render(null);
        } finally {
          polling = false;
        }
      });
      const flush = () => {
        if (!alive || !visible()) pending2 = 0;
        if (sending || !pending2 || !profile) return;
        const n = Math.max(-5, Math.min(5, pending2));
        pending2 -= n;
        sending = true;
        post(`/console/${encodeURIComponent(profile.id)}/${n > 0 ? "dial-right" : "dial-left"}?times=${Math.abs(n)}&${wq}`).catch((e) => {
          pending2 = 0;
          fail2(e);
        }).then(() => {
          sending = false;
          flush();
        });
      };
      let start = null, onKnob = false;
      const visible = () => !document.body.classList.contains("night") && pages[curPage] === page && !box.closest(".stack-item:not(.active)");
      const at2 = (e) => {
        const r = dial.getBoundingClientRect();
        return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI;
      };
      dial.onpointerdown = (e) => {
        const r = dial.getBoundingClientRect();
        onKnob = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2)) < r.width * 0.32;
        start = at2(e);
        turned = 0;
        moved = 0;
        try {
          dial.setPointerCapture(e.pointerId);
        } catch (_) {
        }
      };
      dial.onpointermove = (e) => {
        var _a, _b;
        if (start === null) return;
        const now = at2(e);
        const r = dial.getBoundingClientRect();
        if (Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2)) < r.width * 0.2) {
          start = now;
          return;
        }
        let delta = now - start;
        if (delta > 180) delta -= 360;
        else if (delta < -180) delta += 360;
        start = now;
        angle += delta;
        turned += delta;
        moved += Math.abs(delta);
        knob.style.transform = `rotate(${angle}deg)`;
        while (Math.abs(turned) >= STEP_DEG) {
          const dir = turned > 0 ? 1 : -1;
          turned -= dir * STEP_DEG;
          if (dir > 0 ? (_a = profile == null ? void 0 : profile.dial) == null ? void 0 : _a.right : (_b = profile == null ? void 0 : profile.dial) == null ? void 0 : _b.left) {
            pending2 += dir;
            haptic();
          }
        }
        flush();
      };
      dial.onpointerup = dial.onpointercancel = (e) => {
        var _a;
        const tap = start !== null && moved < 6 && e.type === "pointerup" && onKnob;
        start = null;
        if (tap && ((_a = profile == null ? void 0 : profile.dial) == null ? void 0 : _a.press)) {
          haptic();
          post(`/console/${encodeURIComponent(profile.id)}/dial-press?${wq}`).catch(fail2);
        }
      };
      return {
        update() {
          if (!alive || !visible()) return;
          if (Date.now() - lastPoll > 1500) poll2();
        },
        destroy() {
          alive = false;
          pending2 = 0;
        }
      };
    }
  };

  // ../../../tmp/claude-0/-home-claude/d7433526-111a-5017-bcc4-3fd104415c33/scratchpad/pb/src/android/app/src/main/assets/www/widgets/dictate.js
  var sessions = /* @__PURE__ */ new Map();
  window.onAndroidSpeech = (kind, text, id) => {
    const handler = sessions.get(id);
    if (handler) handler(kind, text);
  };
  var MAX_CHARS = 1e3;
  var ERRORS = {
    "1": "w.dictate.network",
    "2": "w.dictate.network",
    "4": "w.dictate.network",
    "13": "w.dictate.network",
    "6": "w.dictate.noMatch",
    "7": "w.dictate.noMatch",
    "9": "w.dictate.permission",
    permission: "w.dictate.permission",
    "permission-blocked": "w.dictate.permissionBlocked",
    unavailable: "w.dictate.unavailable",
    "offline-unsupported": "w.dictate.offlineUnsupported",
    "offline-unavailable": "w.dictate.network"
  };
  W.dictate = {
    needs: ["tick"],
    create(box, { o, page, w }) {
      box.classList.add("dc");
      const wq = "widget=" + encodeURIComponent(`${page.id}/${w.id}`);
      const mic = h("button", "dc-mic", icon("mic"));
      mic.setAttribute("aria-label", t("w.dictate.tap"));
      const said = h("div", "dc-text");
      const note = h("div", "dc-note", t("w.dictate.tap"));
      box.append(mic, said, note);
      let alive = true, session = 0;
      const can = !!(bridge && bridge.listen && bridge.canListen);
      const visible = () => !document.body.classList.contains("night") && pages[curPage] === page && !box.closest(".stack-item:not(.active)");
      let watch = 0;
      const done = () => {
        sessions.delete(session);
        session = 0;
        mic.classList.remove("on");
        clearInterval(watch);
        watch = 0;
      };
      const guard = () => {
        if (session && !visible()) {
          bridge.cancelListening(session);
          done();
          say("w.dictate.tap");
        }
      };
      const say = (key) => {
        note.textContent = key ? t(key) : "";
      };
      function send(text) {
        return __async(this, null, function* () {
          if (o.control !== true) {
            say("w.dictate.controlOff");
            return;
          }
          const query = encodeURIComponent(text);
          if (text.length > MAX_CHARS || query.length > 12e3) {
            say("w.dictate.tooLong");
            return;
          }
          const ctl = new AbortController();
          const timer = setTimeout(() => ctl.abort(), 3e4);
          try {
            const r = yield fetch(`${API}/dictate?${wq}&text=${query}`, {
              method: "POST",
              cache: "no-store",
              signal: ctl.signal,
              headers: PANEL_HEADERS
            });
            if (!r.ok) {
              let error = "HTTP " + r.status;
              try {
                error = (yield r.json()).error || error;
              } catch (_) {
              }
              throw new Error(error);
            }
            if (alive) say("w.dictate.sent");
          } catch (e) {
            if (alive) {
              say("");
              toast((e == null ? void 0 : e.message) || t("w.offline"), "err");
            }
          } finally {
            clearTimeout(timer);
          }
        });
      }
      function onSpeech(kind, text) {
        if (!alive) return;
        if (kind === "ready") {
          said.textContent = "";
          say("w.dictate.listening");
        } else if (kind === "partial") said.textContent = text;
        else if (kind === "final") {
          done();
          said.textContent = text;
          if (text.trim()) send(text);
          else say("w.dictate.noMatch");
        } else if (kind === "error") {
          done();
          say(text === "cancelled" ? "w.dictate.tap" : ERRORS[text] || "w.dictate.noMatch");
        }
      }
      mic.onclick = () => {
        haptic();
        if (!can) {
          say("w.dictate.update");
          return;
        }
        if (session) {
          bridge.stopListening(session);
          return;
        }
        if (!bridge.canListen()) {
          say("w.dictate.unavailable");
          return;
        }
        session = bridge.listen(String(o.language || "").trim(), o.offline === true) || 0;
        if (!session) return;
        sessions.set(session, onSpeech);
        watch = setInterval(guard, 500);
        mic.classList.add("on");
        said.textContent = "";
        say("w.dictate.listening");
      };
      if (!can) say("w.dictate.update");
      else if (o.control !== true) say("w.dictate.controlOff");
      return {
        update() {
          guard();
        },
        destroy() {
          alive = false;
          if (session) bridge.cancelListening(session);
          done();
        }
      };
    }
  };

  // ../../../tmp/claude-0/-home-claude/d7433526-111a-5017-bcc4-3fd104415c33/scratchpad/pb/src/android/app/src/main/assets/www/widgets/camera.js
  var DEFAULT_FPS = 5;
  var STATES = {
    pick: "w.camera.pick",
    starting: "w.camera.starting",
    "no-ffmpeg": "w.camera.noFfmpeg",
    unreachable: "w.camera.unreachable",
    login: "w.camera.login",
    "no-picture": "w.camera.noPicture",
    busy: "w.camera.busy",
    unknown: "w.camera.save"
  };
  W.camera = {
    needs: ["tick"],
    create(box, { o, page, w }) {
      box.classList.add("cam");
      const layers = [h("img", "cam-img"), h("img", "cam-img")];
      for (const img of layers) {
        img.alt = "";
        img.style.objectFit = o.fit === "contain" ? "contain" : "cover";
      }
      const note = h("div", "empty cam-note", t("w.camera.starting"));
      box.append(...layers);
      if (o.caption) box.append(h("div", "cam-cap", String(o.caption)));
      box.append(note);
      const wq = "widget=" + encodeURIComponent(`${page.id}/${w.id}`);
      let alive = true, running = false, inflight2 = null, front = 0;
      const urls = [null, null];
      const every2 = () => {
        var _a;
        return 1e3 / Math.max(1, Math.min(10, +((_a = (Array.isArray(cfg.cameras) ? cfg.cameras : []).find((c) => c.id === o.camera)) == null ? void 0 : _a.fps) || DEFAULT_FPS));
      };
      const visible = () => alive && box.isConnected && !document.hidden && !document.body.classList.contains("night") && pages[curPage] === page && !box.closest(".stack-item:not(.active)");
      const say = (text) => {
        note.textContent = text || "";
        note.hidden = !text;
      };
      const clear = () => {
        for (let i = 0; i < 2; i++) {
          layers[i].classList.remove("on");
          layers[i].removeAttribute("src");
          if (urls[i]) {
            URL.revokeObjectURL(urls[i]);
            urls[i] = null;
          }
        }
      };
      const decoded = (img) => img.decode ? img.decode() : new Promise((done, fail2) => {
        img.onload = done;
        img.onerror = fail2;
      });
      const one = () => __async(this, null, function* () {
        const ctl = new AbortController();
        inflight2 = ctl;
        let late;
        const deadline = new Promise((_, fail2) => {
          late = setTimeout(() => {
            ctl.abort();
            fail2(new Error("timeout"));
          }, 8e3);
        });
        deadline.catch(() => {
        });
        try {
          const fresh = urls[front] ? "" : "&fresh=true";
          const r = yield Promise.race([fetch(`${API}/camera?${wq}${fresh}`, { cache: "no-store", headers: PANEL_HEADERS, signal: ctl.signal }), deadline]);
          if (r.status === 204) return every2();
          if (r.ok) {
            const url = URL.createObjectURL(yield Promise.race([r.blob(), deadline]));
            const back = 1 - front, next = layers[back];
            next.src = url;
            try {
              yield Promise.race([decoded(next), deadline]);
            } catch (_) {
              next.removeAttribute("src");
              URL.revokeObjectURL(url);
              return every2();
            }
            if (!visible()) {
              next.removeAttribute("src");
              URL.revokeObjectURL(url);
              return 0;
            }
            if (urls[back]) URL.revokeObjectURL(urls[back]);
            urls[back] = url;
            next.classList.add("on");
            layers[front].classList.remove("on");
            front = back;
            say("");
            return every2();
          }
          const body = yield Promise.race([r.json().catch(() => ({})), deadline]);
          clear();
          say(t(STATES[body.state] || "w.camera.noPicture"));
          return body.state === "pick" || body.state === "unknown" ? 5e3 : 1500;
        } catch (_) {
          clear();
          say(t("w.offline"));
          return 3e3;
        } finally {
          clearTimeout(late);
          inflight2 = null;
        }
      });
      const loop = () => __async(this, null, function* () {
        if (running) return;
        running = true;
        try {
          while (visible()) {
            const started = Date.now();
            const wait = yield one();
            if (!visible()) break;
            yield new Promise((done) => setTimeout(done, Math.max(0, wait - (Date.now() - started))));
          }
        } finally {
          running = false;
          if (!visible()) {
            clear();
            say(t("w.camera.starting"));
          }
        }
      });
      return {
        update() {
          if (visible()) loop();
        },
        destroy() {
          alive = false;
          if (inflight2) inflight2.abort();
          clear();
        }
      };
    }
  };

  // ../../../tmp/claude-0/-home-claude/d7433526-111a-5017-bcc4-3fd104415c33/scratchpad/pb/src/android/app/src/main/assets/www/widgets/spectrum.js
  var PALETTES = {
    classic: [[0, "#16a34a"], [0.55, "#84cc16"], [0.72, "#facc15"], [0.88, "#f97316"], [1, "#ef4444"]],
    fire: [[0, "#7f1d1d"], [0.4, "#dc2626"], [0.7, "#f97316"], [1, "#fde047"]],
    ice: [[0, "#1e3a8a"], [0.45, "#2563eb"], [0.75, "#22d3ee"], [1, "#f0f9ff"]]
  };
  var FALL = { slow: 55, normal: 110, fast: 200 };
  var PEAK_HOLD = 450;
  var PEAK_GRAVITY = 260;
  function frame(d) {
    if (!d || !Array.isArray(d.b)) return;
    D.spectrum = d.b;
    D.spectrumAt = Date.now();
    emit("spectrum");
  }
  window.addEventListener("phonebox-spectrum", (e) => frame(e.detail));
  var mountedBars = /* @__PURE__ */ new Set();
  var shows = (m) => !document.body.classList.contains("night") && m.box.isConnected && pages[curPage] === m.page && !m.box.closest(".stack-item:not(.active)");
  var onScreen = () => [...mountedBars].some(shows);
  function keepAlive() {
    return __async(this, null, function* () {
      let fast = false;
      for (const m of mountedBars) if (!m.box.isConnected) mountedBars.delete(m);
      if (onScreen()) {
        const stream = streaming();
        fast = !stream;
        if (!stream || Date.now() - (D.spectrumWantAt || 0) >= 2e3) {
          try {
            const r = yield api("/spectrum", "GET", 1500);
            D.spectrumWantAt = Date.now();
            D.spectrumShown = r.shown !== false;
            D.spectrumOk = r.active !== false;
            if (!stream && r.b) frame(r);
          } catch (_) {
          }
        }
      }
      setTimeout(keepAlive, fast ? 40 : 250);
    });
  }
  setTimeout(keepAlive, 250);
  function mix(stops, f) {
    let i = 1;
    while (i < stops.length - 1 && stops[i][0] < f) i++;
    const [f0, c0] = stops[i - 1], [f1, c1] = stops[i];
    const t2 = Math.max(0, Math.min(1, (f - f0) / (f1 - f0 || 1)));
    const p = (c, k) => parseInt(c.slice(1 + k * 2, 3 + k * 2), 16);
    return `rgb(${[0, 1, 2].map((k) => Math.round(p(c0, k) + (p(c1, k) - p(c0, k)) * t2)).join(",")})`;
  }
  W.spectrum = {
    needs: ["spectrum"],
    create(box, ctx) {
      const o = ctx.o;
      const me = { box, page: ctx.page };
      mountedBars.add(me);
      const bars = Math.max(4, Math.min(48, Math.round(+o.bars || 24)));
      const style = PALETTES[o.style] ? o.style : o.style === "single" ? "single" : "classic";
      const color2 = /^#[0-9a-f]{6}$/i.test(o.color || "") ? o.color : "#2dd4bf";
      const stops = style === "single" ? [[0, color2], [1, color2]] : PALETTES[style];
      const segmented = o.segments !== false, peaks = o.peaks !== false;
      const fall = FALL[o.falloff] || FALL.normal;
      const canvas = h("canvas", "spec-canvas");
      const wrap = h("div", "spec-wrap", canvas);
      const msg = h("div", "spec-msg", t("w.spectrum.waiting"));
      if (o.title) box.append(h("div", "w-title", o.title));
      box.append(wrap, msg);
      const g = canvas.getContext("2d");
      const level = new Float32Array(bars), peak = new Float32Array(bars), peakAt = new Float64Array(bars), peakV = new Float32Array(bars);
      let target = new Float32Array(bars);
      let W2 = 0, H2 = 0, dpr = 1, colors = [], raf = 0, last = 0;
      const resize = () => {
        if (!box.isConnected) return ro.disconnect();
        dpr = window.devicePixelRatio || 1;
        W2 = Math.max(1, Math.round(wrap.clientWidth * dpr));
        H2 = Math.max(1, Math.round(wrap.clientHeight * dpr));
        canvas.width = W2;
        canvas.height = H2;
        colors = [];
        draw();
      };
      const ro = new ResizeObserver(resize);
      ro.observe(wrap);
      const draw = () => {
        g.clearRect(0, 0, W2, H2);
        if (!W2 || !H2) return;
        const gap = Math.max(1, Math.round(W2 / bars * 0.18));
        const bw = (W2 - gap * (bars - 1)) / bars;
        const segH = Math.max(2 * dpr, Math.round(H2 / 34)), segGap = Math.max(1, Math.round(segH * 0.35));
        const segs = segmented ? Math.max(4, Math.floor((H2 + segGap) / (segH + segGap))) : 0;
        if (segmented && colors.length !== segs) colors = Array.from({ length: segs }, (_, s) => mix(stops, (s + 0.5) / segs));
        let grad = null;
        if (!segmented) {
          grad = g.createLinearGradient(0, H2, 0, 0);
          for (const [f, c] of stops) grad.addColorStop(f, c);
        }
        for (let i = 0; i < bars; i++) {
          const x = Math.round(i * (bw + gap)), w = Math.max(1, Math.round(bw));
          const v = level[i] / 100;
          if (segmented) {
            const lit = Math.round(v * segs);
            for (let s = 0; s < segs; s++) {
              const y = H2 - (s + 1) * segH - s * segGap;
              g.globalAlpha = s < lit ? 1 : 0.07;
              g.fillStyle = colors[s];
              g.fillRect(x, y, w, segH);
            }
            g.globalAlpha = 1;
          } else if (v > 0) {
            g.fillStyle = grad;
            g.fillRect(x, H2 - v * H2, w, v * H2);
          }
          if (peaks && peak[i] > 0.5) {
            g.fillStyle = style === "single" ? color2 : "rgba(226,232,240,.9)";
            if (segmented) {
              const s = Math.min(segs - 1, Math.round(peak[i] / 100 * segs));
              g.fillRect(x, H2 - (s + 1) * segH - s * segGap, w, segH);
            } else {
              const capH = Math.max(2 * dpr, Math.round(H2 / 60));
              g.fillRect(x, Math.max(0, H2 - peak[i] / 100 * H2 - capH), w, capH);
            }
          }
        }
      };
      const step = (t2) => {
        raf = 0;
        if (!box.isConnected) return;
        if (!shows(me)) {
          level.fill(0);
          peak.fill(0);
          target.fill(0);
          last = 0;
          draw();
          return;
        }
        const dt = last ? Math.min(0.1, (t2 - last) / 1e3) : 0;
        last = t2;
        let moving = false;
        for (let i = 0; i < bars; i++) {
          level[i] = target[i] >= level[i] ? target[i] : Math.max(target[i], level[i] - fall * dt);
          if (level[i] >= peak[i]) {
            peak[i] = level[i];
            peakAt[i] = t2;
            peakV[i] = 0;
          } else if (t2 - peakAt[i] > PEAK_HOLD) {
            peakV[i] += PEAK_GRAVITY * dt;
            peak[i] = Math.max(level[i], peak[i] - peakV[i] * dt);
          }
          if (level[i] > 0.1 || peak[i] > 0.5 || target[i] > 0) moving = true;
        }
        if (Date.now() - (D.spectrumAt || 0) > 600) target.fill(0);
        draw();
        if (moving || Date.now() - (D.spectrumAt || 0) < 600) raf = requestAnimationFrame(step);
        else last = 0;
      };
      const kick = () => {
        if (!raf && shows(me)) raf = requestAnimationFrame(step);
      };
      const hint = setInterval(() => {
        if (!box.isConnected) return clearInterval(hint);
        const stale = Date.now() - (D.spectrumAt || 0) > 3e3;
        msg.textContent = t(D.spectrumShown === false ? "w.spectrum.save" : D.spectrumOk === false ? "w.spectrum.unavailable" : "w.spectrum.waiting");
        msg.hidden = !stale;
      }, 1e3);
      return {
        update() {
          const src = D.spectrum;
          if (!src || !src.length) return;
          const next = new Float32Array(bars);
          for (let i = 0; i < bars; i++) {
            const a = Math.floor(i * src.length / bars), b = Math.max(a + 1, Math.floor((i + 1) * src.length / bars));
            let m = 0;
            for (let k = a; k < b; k++) m = Math.max(m, src[k] || 0);
            next[i] = m;
          }
          target = next;
          msg.hidden = true;
          kick();
        }
      };
    }
  };

  // ../../../tmp/claude-0/-home-claude/d7433526-111a-5017-bcc4-3fd104415c33/scratchpad/pb/src/android/app/src/main/assets/www/main.js
  var API = "/agent/api";
  var PANEL_HEADERS = { "X-PhoneBox-Panel": "1" };
  var I18n = window.PhoneBoxI18n;
  var t = (key, vars) => I18n ? I18n.t(key, vars) : key;
  var LOCALE = I18n ? I18n.getLocale() : "en-GB";
  var COLS = 12;
  var ROWS = 6;
  var $ = (id) => document.getElementById(id);
  var BRIDGE = [
    "battery",
    "buzz",
    "haptic",
    "is24Hour",
    "pcs",
    "selectPc",
    "forgetPc",
    "setBrightness",
    "setHomeScreen",
    "setOrientation",
    "setPinned",
    "setVolumeKeys",
    "transport",
    "sensors",
    "version",
    "canListen",
    "listen",
    "stopListening",
    "cancelListening"
  ];
  var bridge = typeof Android === "undefined" ? null : Object.fromEntries(BRIDGE.filter((m) => typeof Android[m] === "function").map((m) => [m, (...args) => Android[m](window.__phoneboxKey || "", ...args)]));
  var PREVIEW = new URLSearchParams(location.search).has("preview") && window.parent !== window;
  var FALLBACK_PAGES = [{
    id: "home",
    title: "Home",
    icon: "\u{1F3E0}",
    enabled: true,
    widgets: [
      { id: "clock", type: "clock", x: 0, y: 0, w: 6, h: 4, options: {} },
      { id: "media", type: "media", x: 6, y: 0, w: 6, h: 4, options: {} },
      { id: "cpu", type: "stat", x: 0, y: 4, w: 3, h: 2, options: { metric: "cpu" } },
      { id: "gpu", type: "stat", x: 3, y: 4, w: 3, h: 2, options: { metric: "gpu" } },
      { id: "ram", type: "stat", x: 6, y: 4, w: 3, h: 2, options: { metric: "ram" } },
      { id: "net", type: "stat", x: 9, y: 4, w: 3, h: 2, options: { metric: "net" } }
    ]
  }];
  var DEFAULT_CFG = {
    weather: { city: "Tallinn", lat: 59.437, lon: 24.745 },
    night: { enabled: true, start: "00:30", end: "07:30", brightness: 0.02 },
    display: { showSeconds: true, idleReturnSec: 90, vibrate: true, volumeKeys: true },
    pages: FALLBACK_PAGES,
    shortcuts: []
  };
  var store = {
    get(k, d) {
      try {
        const v = localStorage.getItem(k);
        return v ? JSON.parse(v) : d;
      } catch (_) {
        return d;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem(k, JSON.stringify(v));
      } catch (_) {
      }
    }
  };
  var cfg = PREVIEW ? __spreadProps(__spreadValues({}, DEFAULT_CFG), { pages: [] }) : __spreadValues(__spreadValues({}, DEFAULT_CFG), store.get("cfg", {}));
  var cfgVersion = null;
  var online = null;
  var lastTouch = Date.now();
  var lastUserTouch = 0;
  var wakeUntil = 0;
  var rulesPaused = null;
  var nightOn = null;
  var evSeq = null;
  var evReplay = false;
  var evGen = 0;
  var stateTs = 0;
  var evSeen = /* @__PURE__ */ new Set();
  var evMark = (s) => {
    evSeen.add(s);
    if (evSeen.size > 400) evSeen.delete(evSeen.values().next().value);
  };
  var evQueue = [];
  var evDrop = 0;
  var evDrain = () => {
    for (const e of evQueue.sort((a, b) => a.seq - b.seq)) if (!evSeen.has(e.seq)) {
      evMark(e.seq);
      handleEvent(e);
    }
    evQueue = [];
  };
  var evPre = null;
  var evOffer = (e) => {
    if (typeof e.seq !== "number" || evSeen.has(e.seq)) return;
    if (evReplay) {
      if (!evQueue.some((q) => q.seq === e.seq)) evQueue.push(e);
      if (evQueue.length > 100) evDrop = Math.max(evDrop, evQueue.shift().seq);
    } else {
      evMark(e.seq);
      handleEvent(e);
    }
  };
  var pushVersion = null;
  var D = { state: null, quotas: null, work: null, procs: null, push: {}, weather: null, calendar: null, notes: store.get("notes", []) };
  var HIST = 90;
  var hist = { cpu: [], gpu: [], ram: [], vram: [], down: [], up: [], ping: [], gputemp: [], cputemp: [], hotspot: [], gpupower: [], gpuclock: [] };
  var pushHist = (k, v) => {
    const a = hist[k];
    a.push(v != null ? v : 0);
    if (a.length > HIST) a.shift();
  };
  function safeFetch(_0) {
    return __async(this, arguments, function* (url, opts = {}) {
      var _a;
      try {
        return yield fetch(url, opts);
      } catch (e) {
        if (!((_a = opts.signal) == null ? void 0 : _a.aborted) && typeof url === "string" && url.startsWith("https://")) {
          return yield fetch(`${API}/proxy?url=${encodeURIComponent(url)}`, __spreadProps(__spreadValues({}, opts), {
            headers: __spreadValues(__spreadValues({}, opts.headers || {}), PANEL_HEADERS)
          }));
        }
        throw e;
      }
    });
  }
  function api(path, method = "GET", timeout = 2500) {
    return __async(this, null, function* () {
      const ctl = new AbortController();
      const t2 = setTimeout(() => ctl.abort(), timeout);
      const deadline = new Promise((_, fail2) => setTimeout(() => fail2(new Error("timeout")), timeout));
      try {
        const work = (() => __async(this, null, function* () {
          const r = yield fetch(API + path, { method, signal: ctl.signal, cache: "no-store", headers: PANEL_HEADERS });
          if (!r.ok) throw new Error("HTTP " + r.status);
          const ct = r.headers.get("content-type") || "";
          return ct.includes("json") ? yield r.json() : yield r.text();
        }))();
        work.catch(() => {
        });
        return yield Promise.race([work, deadline]);
      } finally {
        clearTimeout(t2);
      }
    });
  }
  var haptic = () => {
    try {
      bridge && bridge.haptic();
    } catch (_) {
    }
  };
  var buzz = (p) => {
    var _a;
    try {
      if (bridge && !nightOn && ((_a = cfg.display) == null ? void 0 : _a.vibrate) !== false) bridge.buzz(p);
    } catch (_) {
    }
  };
  var transport = () => {
    try {
      return bridge ? bridge.transport() : "";
    } catch (_) {
      return "";
    }
  };
  function h(tag, cls, ...kids) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    for (const k of kids.flat(3)) if (k != null && k !== false) e.append(k.nodeType ? k : String(k));
    return e;
  }
  var ICONS = {
    x: "M18 6 6 18M6 6l12 12",
    hourglass: "M5 22h14M5 2h14M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2",
    wifiOff: "M8.5 16.5a5 5 0 0 1 7 0M2 8.82a15 15 0 0 1 4.17-2.65M10.66 5c4.01-.36 8.14.9 11.34 3.76M16.85 11.25a10 10 0 0 1 2.22 1.68M5 13a10 10 0 0 1 5.24-2.76M12 20h.01M2 2l20 20",
    warn: "M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01",
    check: "M20 6 9 17l-5-5",
    err: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 8v4M12 16h.01",
    info: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01",
    pause: "M6 4h4v16H6zM14 4h4v16h-4z",
    play: "M6 3l14 9-14 9V3z",
    mic: "M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM19 10v1a7 7 0 0 1-14 0v-1M12 18v4M8 22h8"
  };
  function icon(name, cls = "") {
    const t2 = document.createElement("template");
    t2.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICONS[name] || ""}"/></svg>`;
    const s = t2.content.firstElementChild;
    s.setAttribute("class", "ico" + (cls ? " " + cls : ""));
    return s;
  }
  var pad = (n) => String(n).padStart(2, "0");
  function hour12() {
    var _a;
    const pref = (_a = cfg.display) == null ? void 0 : _a.hour12;
    if (pref === true || pref === "true") return true;
    if (pref === "auto") {
      try {
        if (bridge == null ? void 0 : bridge.is24Hour) return !bridge.is24Hour();
      } catch (_) {
      }
      try {
        return Boolean(new Intl.DateTimeFormat(void 0, { hour: "numeric" }).resolvedOptions().hour12);
      } catch (_) {
      }
    }
    return false;
  }
  var fmtClock = (H, M) => hour12() ? `${H % 12 || 12}:${pad(M)} ${H < 12 ? "AM" : "PM"}` : `${pad(H)}:${pad(M)}`;
  var fmtHM = (d) => fmtClock(d.getHours(), d.getMinutes());
  var fmtTime = (ms) => {
    const s = Math.max(0, Math.floor(ms / 1e3));
    return Math.floor(s / 60) + ":" + pad(s % 60);
  };
  function fmtRate(bps) {
    if (bps == null) return ["\u2014", ""];
    if (bps >= 1e9) return [(bps / 1e9).toFixed(1), "GB/s"];
    if (bps >= 1e6) return [(bps / 1e6).toFixed(bps >= 1e8 ? 0 : 1), "MB/s"];
    if (bps >= 1e3) return [(bps / 1e3).toFixed(0), "KB/s"];
    return [Math.round(bps).toString(), "B/s"];
  }
  var rateStr = (b) => fmtRate(b).join(" ");
  function fmtDur(ms) {
    const m = Math.max(0, Math.round(ms / 6e4));
    if (m < 60) return t("time.min", { m });
    const hr = Math.floor(m / 60);
    if (hr < 24) return t("time.hMin", { h: hr, m: m % 60 });
    const d = Math.floor(hr / 24);
    return t("time.dH", { d, h: hr % 24 });
  }
  function shortDur(ms) {
    const m = Math.max(0, Math.floor(ms / 6e4));
    if (m < 1) return t("time.now");
    if (m < 60) return m + "m";
    const hr = Math.floor(m / 60);
    return hr < 24 ? `${hr}h ${m % 60}m` : `${Math.floor(hr / 24)}d`;
  }
  var ago = (ts) => {
    const d = Date.now() - ts;
    return d < 6e4 ? t("time.justNow") : t("time.ago", { dur: shortDur(d) });
  };
  var r1 = (v) => v == null ? "\u2014" : (Math.round(v * 10) / 10).toString();
  var fmtMem = (mb) => mb >= 1024 ? (mb / 1024).toFixed(1) + " GB" : Math.round(mb) + " MB";
  var cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  var color = (c) => c && c.startsWith("--") ? cssVar(c) : c;
  var toastTimer = 0;
  function toast(msg, kind = "", title = "", seconds = 2.6) {
    const t2 = $("toast");
    const ic = { ok: "check", err: "err", warn: "warn" }[kind] || "info";
    const msgSpan = h("span", null, icon(ic, "m"), msg);
    t2.replaceChildren(...title ? [h("b", null, title), msgSpan] : [msgSpan]);
    t2.className = "toast on " + kind;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t2.className = "toast " + kind, Math.max(1, seconds) * 1e3);
  }
  function sizeCanvas(c) {
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(1, Math.round(c.clientWidth * dpr)), hh = Math.max(1, Math.round(c.clientHeight * dpr));
    if (c.width !== w || c.height !== hh) {
      c.width = w;
      c.height = hh;
    }
    return [c.getContext("2d"), w, hh, dpr];
  }
  function chart(canvas, series, opts = {}) {
    if (!canvas.clientWidth) return;
    const [g, w, hh, dpr] = sizeCanvas(canvas);
    g.clearRect(0, 0, w, hh);
    if (opts.grid) {
      g.strokeStyle = "rgba(255,255,255,0.06)";
      g.lineWidth = 1;
      for (let i = 1; i < 4; i++) {
        const y = Math.round(hh * i / 4) + 0.5;
        g.beginPath();
        g.moveTo(0, y);
        g.lineTo(w, y);
        g.stroke();
      }
    }
    const top = 4 * dpr;
    for (const s of series) {
      const d = s.data;
      if (d.length < 2) continue;
      const max = s.max || 1;
      const step = w / (HIST - 1);
      const x0 = w - (d.length - 1) * step;
      const y = (v) => hh - Math.min(v, max) / max * (hh - top);
      g.beginPath();
      g.moveTo(x0, y(d[0]));
      for (let i = 1; i < d.length; i++) g.lineTo(x0 + i * step, y(d[i]));
      g.lineWidth = 1.6 * dpr;
      g.strokeStyle = s.color;
      g.lineJoin = "round";
      g.stroke();
      g.lineTo(w, hh);
      g.lineTo(x0, hh);
      g.closePath();
      const grad = g.createLinearGradient(0, 0, 0, hh);
      grad.addColorStop(0, s.color + "55");
      grad.addColorStop(1, s.color + "00");
      g.fillStyle = grad;
      g.fill();
    }
  }
  function ringSvg(pct, elapsed) {
    const r = 42, c = 2 * Math.PI * r;
    const off = c * (1 - Math.max(0, Math.min(100, pct)) / 100);
    let tick2 = "";
    if (elapsed != null) {
      const a = elapsed * 2 * Math.PI;
      const p = (rad) => [50 + Math.cos(a) * rad, 50 + Math.sin(a) * rad].map((v) => v.toFixed(1));
      const [x1, y1] = p(35), [x2, y2] = p(49);
      tick2 = `<line class="pace" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
    }
    return `<svg viewBox="0 0 100 100"><circle class="bg" cx="50" cy="50" r="${r}"/><circle class="fg" cx="50" cy="50" r="${r}" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"/>${tick2}</svg>`;
  }
  var shortCpu = (n) => (n || "").replace(/^(AMD|Intel\(R\))\s*/, "").split(" ").slice(0, 4).join(" ");
  var gpuOf = (s) => {
    var _a;
    return (_a = s == null ? void 0 : s.pc) == null ? void 0 : _a.gpu;
  };
  var gpusOf = (s) => {
    var _a, _b, _c;
    return ((_b = (_a = s == null ? void 0 : s.pc) == null ? void 0 : _a.gpus) == null ? void 0 : _b.length) ? s.pc.gpus : ((_c = s == null ? void 0 : s.pc) == null ? void 0 : _c.gpu) ? [s.pc.gpu] : [];
  };
  var shortGpu = (n) => (n || "GPU").replace(/^(NVIDIA|AMD|Intel\(R\))\s+/i, "").replace(/\((TM|R)\)/gi, "").replace(/\s+/g, " ").trim();
  function gpuMem(g) {
    if (!g) return null;
    if (g.integrated && g.sharedTotal) {
      return { label: "GPU memory", used: (g.vramUsed || 0) + (g.sharedUsed || 0), total: (g.vramTotal || 0) + g.sharedTotal };
    }
    return g.vramTotal ? { label: "VRAM", used: g.vramUsed || 0, total: g.vramTotal } : null;
  }
  var memText = (m) => `${r1(m.used)} / ${Math.round(m.total)} GB`;
  var gpuPower = (g) => (g == null ? void 0 : g.power) != null ? `${Math.round(g.power)} W` : (g == null ? void 0 : g.powerPct) != null ? `${Math.round(g.powerPct)}% power` : null;
  var netMax = () => Math.max(1, ...hist.down, ...hist.up) * 1.15;
  var METRICS = {
    cpu: {
      label: "CPU",
      name: "Processor",
      color: "--cpu",
      unit: "%",
      max: () => 100,
      val: (s) => {
        var _a;
        return (_a = s.pc) == null ? void 0 : _a.cpu;
      },
      sub: (s) => {
        var _a, _b;
        return ((_a = s.pc) == null ? void 0 : _a.cpuTemp) != null ? `${Math.round(s.pc.cpuTemp)}\xB0C` : shortCpu((_b = s.pc) == null ? void 0 : _b.cpuName);
      },
      title: (s) => {
        var _a;
        return (_a = s.pc) == null ? void 0 : _a.cpuName;
      }
    },
    gpu: {
      label: "GPU",
      name: "Graphics",
      color: "--gpu",
      unit: "%",
      max: () => 100,
      val: (s) => {
        var _a;
        return (_a = gpuOf(s)) == null ? void 0 : _a.util;
      },
      sub: (s) => {
        const g = gpuOf(s);
        if (!g) return "No GPU data";
        const parts = [g.temp != null ? `${Math.round(g.temp)}\xB0C` : null, gpuPower(g)].filter(Boolean);
        if (parts.length) return parts.join(" \xB7 ");
        const mem = gpuMem(g);
        if (mem) return `${memText(mem)} memory`;
        return shortGpu(g.name) || "Active";
      },
      title: (s) => {
        var _a;
        return (_a = gpuOf(s)) == null ? void 0 : _a.name;
      }
    },
    ram: {
      label: "RAM",
      name: "Memory",
      color: "--ram",
      unit: "GB",
      max: (s) => {
        var _a;
        return ((_a = s.pc) == null ? void 0 : _a.ramTotalGb) || 1;
      },
      val: (s) => {
        var _a;
        return (_a = s.pc) == null ? void 0 : _a.ramUsedGb;
      },
      fmt: r1,
      pct: (s) => s.pc ? s.pc.ramUsedGb / s.pc.ramTotalGb * 100 : null,
      sub: (s) => s.pc && s.pc.ramTotalGb ? `${r1(s.pc.ramUsedGb)} / ${Math.round(s.pc.ramTotalGb)} GB` : ""
    },
    vram: {
      label: "VRAM",
      name: "Video memory",
      color: "--gpu",
      unit: "%",
      max: () => 100,
      val: (s) => {
        const m = gpuMem(gpuOf(s));
        return m ? m.used / m.total * 100 : null;
      },
      sub: (s) => {
        const m = gpuMem(gpuOf(s));
        return m ? memText(m) : "No GPU data";
      }
    },
    net: {
      label: "NETWORK",
      name: "Network",
      color: "--net",
      rate: true,
      hist: "down",
      max: netMax,
      val: (s) => {
        var _a;
        return (_a = s.pc) == null ? void 0 : _a.netDownBps;
      },
      sub: (s) => {
        var _a, _b;
        return "\u2191 " + rateStr((_a = s.pc) == null ? void 0 : _a.netUpBps) + (((_b = s.ping) == null ? void 0 : _b.ms) != null ? ` \xB7 ${Math.round(s.ping.ms)} ms` : "");
      }
    },
    down: { label: "DOWNLOAD", name: "Download", color: "--net", rate: true, max: netMax, val: (s) => {
      var _a;
      return (_a = s.pc) == null ? void 0 : _a.netDownBps;
    } },
    up: { label: "UPLOAD", name: "Upload", color: "--up", rate: true, max: netMax, val: (s) => {
      var _a;
      return (_a = s.pc) == null ? void 0 : _a.netUpBps;
    } },
    ping: {
      label: "PING",
      name: "Ping",
      color: "#38bdf8",
      unit: "ms",
      max: () => Math.max(50, ...hist.ping) * 1.2,
      val: (s) => {
        var _a;
        return (_a = s.ping) == null ? void 0 : _a.ms;
      },
      sub: (s) => {
        var _a;
        return s.ping ? `avg ${(_a = s.ping.avgMs) != null ? _a : "\u2014"} ms \xB7 loss ${s.ping.lossPct}%` : "";
      }
    },
    gputemp: {
      label: "GPU TEMP",
      name: "GPU temperature",
      color: "#f97316",
      unit: "\xB0C",
      max: () => 100,
      hot: [75, 85],
      val: (s) => {
        var _a;
        return (_a = gpuOf(s)) == null ? void 0 : _a.temp;
      },
      sub: (s) => {
        const g = gpuOf(s);
        if (!g) return "No GPU data";
        const detail = [
          g.hotSpot != null ? `Hot spot ${Math.round(g.hotSpot)}\xB0` : null,
          g.fan != null ? `Fan ${Math.round(g.fan)}%` : g.fanRpm != null ? `Fan ${Math.round(g.fanRpm)} rpm` : null,
          g.clock != null ? `${Math.round(g.clock)} MHz` : null
        ].filter(Boolean);
        return detail.length ? detail.join(" \xB7 ") : g.temp != null ? "Temperature" : "No GPU data";
      }
    },
    hotspot: {
      label: "HOT SPOT",
      name: "GPU hot spot",
      color: "#ef4444",
      unit: "\xB0C",
      max: () => 110,
      hot: [90, 100],
      val: (s) => {
        var _a;
        return (_a = gpuOf(s)) == null ? void 0 : _a.hotSpot;
      },
      sub: (s) => {
        const g = gpuOf(s);
        if ((g == null ? void 0 : g.hotSpot) == null) return "needs LibreHardwareMonitor";
        return [g.temp != null ? `Edge ${Math.round(g.temp)}\xB0` : null, g.memTemp != null ? `Memory ${Math.round(g.memTemp)}\xB0` : null].filter(Boolean).join(" \xB7 ");
      }
    },
    gpupower: {
      label: "GPU POWER",
      name: "GPU power",
      color: "#facc15",
      unit: (s) => {
        var _a;
        return ((_a = gpuOf(s)) == null ? void 0 : _a.power) != null ? "W" : "%";
      },
      max: (s) => {
        const g = gpuOf(s);
        return (g == null ? void 0 : g.power) != null ? Math.max(g.powerLimit || 0, ...hist.gpupower, 50) : 100;
      },
      val: (s) => {
        var _a;
        const g = gpuOf(s);
        return (_a = g == null ? void 0 : g.power) != null ? _a : g == null ? void 0 : g.powerPct;
      },
      sub: (s) => {
        const g = gpuOf(s);
        if (!g || g.power == null && g.powerPct == null) return "No power data";
        if (g.power != null && g.powerLimit) return `of ${Math.round(g.powerLimit)} W limit`;
        return g.power != null ? shortGpu(g.name) : "of the power limit";
      }
    },
    gpuclock: {
      label: "GPU CLOCK",
      name: "GPU clock",
      color: "#a78bfa",
      unit: "MHz",
      max: () => Math.max(1e3, ...hist.gpuclock) * 1.1,
      val: (s) => {
        var _a;
        return (_a = gpuOf(s)) == null ? void 0 : _a.clock;
      },
      sub: (s) => {
        const g = gpuOf(s);
        return (g == null ? void 0 : g.memClock) != null ? `Memory ${Math.round(g.memClock)} MHz` : (g == null ? void 0 : g.clock) == null ? "No clock data" : "";
      }
    },
    cputemp: {
      label: "CPU TEMP",
      name: "CPU temperature",
      color: "#fb7185",
      unit: "\xB0C",
      max: () => 100,
      hot: [75, 85],
      val: (s) => {
        var _a;
        return (_a = s.pc) == null ? void 0 : _a.cpuTemp;
      },
      sub: (s) => {
        var _a, _b;
        return ((_a = s.pc) == null ? void 0 : _a.cpuTemp) == null ? "needs LibreHardwareMonitor" : shortCpu((_b = s.pc) == null ? void 0 : _b.cpuName);
      }
    }
  };
  function metricText(m, s) {
    const v = m.val(s);
    if (m.rate) return fmtRate(v);
    const unit = (typeof m.unit === "function" ? m.unit(s) : m.unit) || "";
    if (v == null) return ["\u2014", unit];
    return [m.fmt ? m.fmt(v) : String(Math.round(v)), unit];
  }
  var WX = {
    0: ["wx.clear", "\u2600\uFE0F", "\u{1F319}"],
    1: ["wx.mostlyClear", "\u{1F324}\uFE0F", "\u{1F319}"],
    2: ["wx.partlyCloudy", "\u26C5", "\u2601\uFE0F"],
    3: ["wx.overcast", "\u2601\uFE0F", "\u2601\uFE0F"],
    45: ["wx.fog", "\u{1F32B}\uFE0F"],
    48: ["wx.rimeFog", "\u{1F32B}\uFE0F"],
    51: ["wx.lightDrizzle", "\u{1F326}\uFE0F"],
    53: ["wx.drizzle", "\u{1F326}\uFE0F"],
    55: ["wx.heavyDrizzle", "\u{1F327}\uFE0F"],
    56: ["wx.freezingDrizzle", "\u{1F327}\uFE0F"],
    57: ["wx.freezingDrizzle", "\u{1F327}\uFE0F"],
    61: ["wx.lightRain", "\u{1F326}\uFE0F"],
    63: ["wx.rain", "\u{1F327}\uFE0F"],
    65: ["wx.heavyRain", "\u{1F327}\uFE0F"],
    66: ["wx.freezingRain", "\u{1F327}\uFE0F"],
    67: ["wx.freezingRain", "\u{1F327}\uFE0F"],
    71: ["wx.lightSnow", "\u{1F328}\uFE0F"],
    73: ["wx.snow", "\u{1F328}\uFE0F"],
    75: ["wx.heavySnow", "\u2744\uFE0F"],
    77: ["wx.snowGrains", "\u{1F328}\uFE0F"],
    80: ["wx.lightShowers", "\u{1F326}\uFE0F"],
    81: ["wx.showers", "\u{1F327}\uFE0F"],
    82: ["wx.heavyShowers", "\u26C8\uFE0F"],
    85: ["wx.snowShowers", "\u{1F328}\uFE0F"],
    86: ["wx.heavySnowShowers", "\u2744\uFE0F"],
    95: ["wx.thunderstorm", "\u26C8\uFE0F"],
    96: ["wx.thunderstormHail", "\u26C8\uFE0F"],
    99: ["wx.severeHail", "\u26C8\uFE0F"]
  };
  var wxIcon = (code, day = 1) => {
    const x = WX[code] || [null, "\u{1F321}\uFE0F"];
    return day === 0 && x[2] ? x[2] : x[1];
  };
  var wxText = (code) => {
    const x = WX[code];
    return x ? t(x[0]) : "\u2014";
  };
  var weatherRetry = 0;
  var weatherFor = "";
  var weatherKey = () => {
    const { lat, lon } = cfg.weather || DEFAULT_CFG.weather;
    return `v3:${lat},${lon}`;
  };
  function loadWeather(force = false) {
    return __async(this, null, function* () {
      const { lat, lon } = cfg.weather || DEFAULT_CFG.weather;
      const key = weatherKey();
      const cached3 = store.get("wx", null);
      if (D.weather && weatherFor !== key) {
        D.weather = null;
        emit("weather");
      }
      if (cached3 && cached3.key === key && !D.weather) {
        D.weather = cached3.data;
        weatherFor = key;
        emit("weather");
      }
      if (!force && cached3 && cached3.key === key && Date.now() - cached3.at < 14 * 6e4) return;
      if (!anyNeeds("weather")) return;
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,weather_code,is_day&hourly=temperature_2m,weather_code,precipitation_probability,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,daylight_duration,uv_index_max&timezone=auto&forecast_days=7`;
        const ctl = new AbortController();
        setTimeout(() => ctl.abort(), 8e3);
        const r = yield safeFetch(url, { signal: ctl.signal });
        if (!r.ok) throw new Error("HTTP " + r.status);
        const data = yield r.json();
        if (!data || !data.current) throw new Error("no forecast");
        if (weatherKey() !== key) return;
        store.set("wx", { key, at: Date.now(), data });
        D.weather = data;
        weatherFor = key;
        emit("weather");
      } catch (_) {
        if (!D.weather) {
          D.weather = false;
          emit("weather");
        }
        if (!weatherRetry) weatherRetry = setTimeout(() => {
          weatherRetry = 0;
          loadWeather();
        }, 2 * 6e4);
      }
    });
  }
  function wxLines() {
    var _a;
    const w = D.weather;
    if (!w || !w.current) return null;
    const c = w.current, d = w.daily || {};
    const desc = wxText(c.weather_code);
    const hi = d.temperature_2m_max ? Math.round(d.temperature_2m_max[0]) : null;
    const lo = d.temperature_2m_min ? Math.round(d.temperature_2m_min[0]) : null;
    return {
      icon: wxIcon(c.weather_code, c.is_day),
      temp: Math.round(c.temperature_2m) + "\xB0",
      desc: `${desc} \xB7 ${((_a = cfg.weather) == null ? void 0 : _a.city) || ""}`,
      range: (hi != null ? `\u2191${hi}\xB0 \u2193${lo}\xB0 \xB7 ` : "") + t("wx.feelsLike", { deg: Math.round(c.apparent_temperature) })
    };
  }
  function wxBlock() {
    const e = h(
      "div",
      "wx",
      h("span", "wx-icon", "\xB7"),
      h("span", "wx-temp", "--\xB0"),
      h("div", "wx-meta", h("span", "wx-desc", t("w.loading")), h("span", "wx-range muted"))
    );
    e.update = () => {
      const l = wxLines();
      if (!l) {
        e.querySelector(".wx-icon").textContent = "\xB7";
        e.querySelector(".wx-temp").textContent = "--\xB0";
        e.querySelector(".wx-range").textContent = "";
        e.querySelector(".wx-desc").textContent = D.weather === null ? t("w.loading") : t("w.weatherUnavailable");
        return;
      }
      e.querySelector(".wx-icon").textContent = l.icon;
      e.querySelector(".wx-temp").textContent = l.temp;
      e.querySelector(".wx-desc").textContent = l.desc;
      e.querySelector(".wx-range").textContent = l.range;
    };
    return e;
  }
  function phoneBattery() {
    if (!bridge) return "";
    try {
      const b = JSON.parse(bridge.battery());
      return `\u{1F4F1} ${b.level}%${b.plugged ? " \u26A1" : ""}`;
    } catch (_) {
      return "";
    }
  }
  function quotaProviders() {
    var _a;
    return ((_a = D.quotas) == null ? void 0 : _a.providers) || [];
  }
  function renderStatus(el) {
    var _a, _b, _c, _d;
    const via = transport();
    const name = online ? (((_a = D.state) == null ? void 0 : _a.host) || "PC") + (via === "wifi" ? " \xB7 " + t("status.wiFi") : via === "usb" ? " \xB7 " + t("status.usb") : "") : online === false ? t("panel.pcNotConnected") : t("panel.connecting");
    const kids = [h("span", "dot " + (online ? "on" : online === false ? "off" : "")), h("span", null, name)];
    const bat = phoneBattery();
    if (bat) kids.push(h("span", "sep", "\xB7"), h("span", null, bat));
    for (const p of quotaProviders()) {
      const l = (_b = p.limits) == null ? void 0 : _b[0];
      if (!l) continue;
      const s = h("span", "qm", h("span", "sep", "\xB7"), p.name + " ", h("b", null, Math.round(l.percent) + "%"));
      if (l.percent >= 95) s.style.color = "#f87171";
      else if (l.percent >= 80) s.style.color = "#fbbf24";
      kids.push(s);
    }
    const waiting = (((_c = D.work) == null ? void 0 : _c.sessions) || []).filter((s) => s.status === "waiting").length;
    if (waiting) kids.push(h("span", "sep", "\xB7"), h("span", "smini", t("status.waitingCount", { n: waiting })));
    const u = (_d = D.state) == null ? void 0 : _d.update;
    if (u) kids.push(h("span", "sep", "\xB7"), h("span", "upd", u.app && via !== "usb" ? t("status.updateUsb", { version: u.latest }) : t("status.updateAvailable", { version: u.latest })));
    el.replaceChildren(...kids);
    while (el.scrollWidth > el.clientWidth + 1 && el.querySelector(".qm")) [...el.querySelectorAll(".qm")].pop().remove();
  }
  function runShortcut(btn, id) {
    return __async(this, null, function* () {
      haptic();
      btn.classList.remove("ok", "err");
      btn.classList.add("busy");
      let ok = false;
      try {
        yield api("/run/" + encodeURIComponent(id), "POST", 5e3);
        ok = true;
      } catch (_) {
      }
      btn.classList.remove("busy");
      btn.classList.add(ok ? "ok" : "err");
      setTimeout(() => btn.classList.remove("ok", "err"), 900);
    });
  }
  function keyButton(s) {
    const icon2 = h("span", "k-icon", s.icon || "\u2022");
    const b = h("button", "key" + (s.toggle ? " toggle" : ""), icon2, h("span", "k-label", s.label));
    b.style.setProperty("--k", s.color || "#6b7280");
    b.dataset.id = s.id;
    b.addEventListener("click", () => runShortcut(b, s.id));
    if (s.iconRev != null) applyShortcutIcon(icon2, s.id);
    return b;
  }
  function applyShortcutIcon(icon2, id) {
    const img = new Image();
    img.onload = () => {
      icon2.replaceChildren(img);
      icon2.classList.add("k-icon-img");
    };
    img.src = `${API}/shortcuts/icon?id=${encodeURIComponent(id)}`;
  }
  var media = null;
  var volDragging = null;
  function setVolDragging(control, dragging) {
    if (dragging) volDragging = control;
    else if (volDragging === control) volDragging = null;
  }
  var setMediaState = (m) => {
    if (D.state) D.state.media = m || null;
    media = m ? __spreadProps(__spreadValues({}, m), { at: performance.now() }) : null;
    emit("state");
  };
  var DEFAULT_AMBIENT = "45, 212, 191";
  var artTint = true;
  var currentArtColor = null;
  var setArtColor = (c) => {
    currentArtColor = c;
    setAmbient(c);
  };
  var hexToRgb = (hex) => {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
    if (!m) return null;
    const n = parseInt(m[1], 16);
    return `${n >> 16}, ${n >> 8 & 255}, ${n & 255}`;
  };
  function averageColor(img) {
    try {
      const c = document.createElement("canvas");
      c.width = c.height = 16;
      const g = c.getContext("2d");
      g.drawImage(img, 0, 0, 16, 16);
      const d = g.getImageData(0, 0, 16, 16).data;
      let r = 0, gg = 0, b = 0, n = 0;
      for (let i = 0; i < d.length; i += 4) {
        const mx = Math.max(d[i], d[i + 1], d[i + 2]), mn = Math.min(d[i], d[i + 1], d[i + 2]);
        if (mx < 30 || mx - mn < 20) continue;
        r += d[i];
        gg += d[i + 1];
        b += d[i + 2];
        n++;
      }
      if (!n) return null;
      const [R, G, B] = [r / n, gg / n, b / n];
      const k = 220 / (Math.max(R, G, B) || 1);
      return [R, G, B].map((v) => Math.round(Math.min(255, v * k))).join(", ");
    } catch (_) {
      return null;
    }
  }
  var setAmbient = (rgb) => document.documentElement.style.setProperty("--ambient", artTint && rgb || DEFAULT_AMBIENT);
  var mediaHtml = () => `
  <div class="m-top">
    <div class="art-wrap"><img class="art" alt=""><div class="art-ph">\u266A</div></div>
    <div class="m-text"><div class="m-app"><span class="m-source-icon" aria-hidden="true"></span><span class="m-app-name">Media</span></div><div class="m-title">${t("w.nothingPlaying")}</div><div class="m-artist">${t("w.startOnPc")}</div></div>
  </div>
  <div class="m-progress"><div class="bar"><div class="fill"></div></div><div class="times"><span class="m-pos">0:00</span><span class="m-dur">0:00</span></div></div>
  <div class="m-controls">
    <button class="ic" data-media="prev" aria-label="Previous"><svg viewBox="0 0 24 24"><path d="M6 5h2v14H6zM20 5v14L9.5 12z"/></svg></button>
    <button class="ic play" data-media="playpause" aria-label="Play/Pause">
      <svg class="i-play" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
      <svg class="i-pause" viewBox="0 0 24 24"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>
    </button>
    <button class="ic" data-media="next" aria-label="Next"><svg viewBox="0 0 24 24"><path d="M16 5h2v14h-2zM4 5v14l10.5-7z"/></svg></button>
    <div class="vol">
      <button class="ic sm mute" aria-label="Mute">
        <svg class="i-vol" viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9zm11.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z"/></svg>
        <svg class="i-mute" viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9zm12.6 3 2.2-2.2-1.4-1.4-2.2 2.2-2.2-2.2-1.4 1.4 2.2 2.2-2.2 2.2 1.4 1.4 2.2-2.2 2.2 2.2 1.4-1.4z"/></svg>
      </button>
      <input type="range" class="volr" min="0" max="100" step="1" value="50"><span class="vol-val">--</span>
    </div>
  </div>
  <div class="offline-msg"><b data-i18n="panel.computerNotConnected">${t("panel.computerNotConnected")}</b>
    <span data-i18n="panel.offlineHelp">${t("panel.offlineHelp")}</span></div>`;
  var Q_STYLE = { antigravity: { color: "#38bdf8", logo: "\u2726" }, claude: { color: "#d97757", logo: "\u2733\uFE0E" }, codex: { color: "#e5e7eb", logo: "\u25CE" } };
  function fmtReset(ts) {
    if (!ts) return "";
    const d = new Date(ts);
    const hm = fmtHM(d);
    const day = d.toDateString() === (/* @__PURE__ */ new Date()).toDateString() ? hm : d.toLocaleDateString(LOCALE, { weekday: "short" }) + " " + hm;
    return `${day} \xB7 ${t("time.inDur", { dur: fmtDur(ts - Date.now()) })}`;
  }
  function paceInfo(l) {
    if (!l.resetsAt || !l.windowSec) return null;
    const win = l.windowSec * 1e3;
    const left = l.resetsAt - Date.now();
    const elapsed = Math.min(1, Math.max(0, 1 - left / win));
    if (l.percent >= 100) return { elapsed, cls: "over", text: t("pace.limitReached") };
    if (elapsed < 0.04 || l.percent < 1) return { elapsed, cls: "calm", text: t("pace.plentyLeft") };
    const rate = l.percent / (elapsed * win);
    const msTo100 = (100 - l.percent) / rate;
    if (msTo100 < left) return { elapsed, cls: "over", text: t("pace.fullIn", { dur: fmtDur(msTo100) }) };
    const diff = l.percent - elapsed * 100;
    if (diff > 10) return { elapsed, cls: "fast", text: t("pace.ahead") };
    if (diff < -10) return { elapsed, cls: "calm", text: t("pace.plentyLeft") };
    return { elapsed, cls: "", text: t("pace.onPace") };
  }
  var S_ORDER = { waiting: 0, busy: 1, shell: 2, idle: 3 };
  var prevStatus = /* @__PURE__ */ new Map();
  var workLoaded = false;
  function notifyTransitions(sessions2) {
    for (const s of sessions2) {
      const before = prevStatus.get(s.id);
      if (workLoaded && before && before !== s.status) {
        if (s.status === "waiting") {
          buzz("0,90,90,90,90,160");
          toast(s.waitingFor || t("panel.needsInput"), "err", s.name);
        } else if (s.status === "idle" && (before === "busy" || before === "shell")) {
          buzz("0,70,110,70");
          toast(t("panel.sessionFinished", { name: s.name }), "ok");
        }
      }
      prevStatus.set(s.id, s.status);
    }
    workLoaded = true;
  }
  function prRow(p, mine) {
    const row = h("div", "gh-pr" + (p.draft ? " draft" : ""));
    if (mine) {
      const ciMap = { SUCCESS: "\u2713", FAILURE: "\u2717", ERROR: "\u2717", PENDING: "\u25CF", EXPECTED: "\u25CF" };
      row.appendChild(h("span", "ci " + (p.ci || "none"), ciMap[p.ci] || "\u2013"));
    } else {
      row.appendChild(h("span", "ci none", "\u25C7"));
    }
    row.append(h("span", "rp", `${p.repo.split("/")[1]}#${p.number}`), h("span", "tt", p.title));
    if (mine && (p.review === "APPROVED" || p.review === "CHANGES_REQUESTED"))
      row.appendChild(h("span", "rv " + p.review, p.review === "APPROVED" ? "approved" : "changes"));
    return row;
  }
  function monogramColor(name) {
    let x = 0;
    for (const ch of name) x = (x * 31 + ch.charCodeAt(0)) % 360;
    return `hsl(${x}, 70%, 65%)`;
  }
  var ICON_CACHE = /* @__PURE__ */ new Map();
  var MAX_ICON_CACHE = 200;
  function fillIcon(box, g) {
    box.replaceChildren();
    const cached3 = ICON_CACHE.get(g.name);
    if (cached3) {
      box.textContent = "";
      box.style.background = "transparent";
      box.appendChild(cached3.cloneNode(true));
      return;
    }
    box.style.background = monogramColor(g.name);
    box.textContent = (g.title || g.name).charAt(0).toUpperCase();
    if (g.hasIcon !== false) {
      const img = new Image();
      img.onload = () => {
        if (ICON_CACHE.size >= MAX_ICON_CACHE) {
          const oldest = ICON_CACHE.keys().next().value;
          if (oldest !== void 0) ICON_CACHE.delete(oldest);
        }
        ICON_CACHE.set(g.name, img);
        box.textContent = "";
        box.style.background = "transparent";
        box.appendChild(img);
      };
      img.src = `${API}/procs/icon?name=${encodeURIComponent(g.name)}`;
    }
  }
  var sheet = null;
  function armButton(btn, armedText, action) {
    btn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      if (btn.disabled) return;
      if (!btn.classList.contains("armed")) {
        haptic();
        btn.dataset.text = btn.textContent;
        btn.textContent = armedText;
        btn.classList.add("armed");
        clearTimeout(btn._t);
        btn._t = setTimeout(() => {
          btn.classList.remove("armed");
          btn.textContent = btn.dataset.text;
        }, 3500);
        return;
      }
      clearTimeout(btn._t);
      btn.classList.remove("armed");
      action();
    });
  }
  function openSheet(g, canKill) {
    sheet = { group: g, detail: null, canKill };
    fillIcon($("psIco"), g);
    $("psTitle").textContent = g.title;
    $("psSub").textContent = t("w.loading");
    $("psList").replaceChildren();
    $("pSheet").hidden = false;
    loadSheet();
  }
  function closeSheet() {
    sheet = null;
    $("pSheet").hidden = true;
    closeSessionDetails();
  }
  function closeSessionDetails() {
    const backdrop = document.querySelector(".session-backdrop");
    if (backdrop) backdrop.click();
    return !!backdrop;
  }
  function loadSheet() {
    return __async(this, null, function* () {
      if (!sheet) return;
      try {
        const d = yield api("/procs/detail?name=" + encodeURIComponent(sheet.group.name));
        if (!sheet || d.name !== sheet.group.name) return;
        sheet.detail = d;
        renderSheet();
      } catch (_) {
      }
    });
  }
  function renderSheet() {
    const d = sheet.detail, canKill = sheet.canKill;
    const totalCpu = d.instances.reduce((a, i) => a + i.cpu, 0), totalMem = d.instances.reduce((a, i) => a + i.memMb, 0);
    const instLabel = t(d.instances.length === 1 ? "panel.instanceOne" : "panel.instanceMany", { n: d.instances.length });
    $("psSub").textContent = `${instLabel} \xB7 CPU ${totalCpu.toFixed(1)}% \xB7 ${fmtMem(totalMem)}` + (d.locked ? ` \xB7 ${t("panel.systemProcess")}` : !canKill ? ` \xB7 ${t("panel.endingDisabled")}` : "");
    const all = $("psAll");
    if (!all.classList.contains("armed")) all.textContent = d.instances.length > 1 ? t("panel.endAllN", { n: d.instances.length }) : t("panel.end");
    all.disabled = d.locked || !canKill || !d.instances.length;
    const list = $("psList");
    list.replaceChildren();
    if (!d.instances.length) {
      list.appendChild(h("div", "empty", t("panel.noInstances")));
      return;
    }
    for (const i of d.instances) {
      const primary = i.session ? "\u2733\uFE0E " + i.session : i.window || i.args || d.title;
      const secondary = [
        i.session ? i.args : i.window ? i.args : null,
        i.startedAt ? Date.now() - i.startedAt < 6e4 ? t("panel.justStarted") : t("panel.startedAgo", { dur: shortDur(Date.now() - i.startedAt) }) : null
      ].filter(Boolean).join(" \xB7 ");
      const btn = h("button", "ps-btn danger", t("panel.end"));
      btn.disabled = i.locked || !canKill;
      armButton(btn, t("panel.confirm"), () => killInstance(i, primary));
      list.appendChild(h(
        "div",
        "pi",
        h("span", "pid", "PID " + i.pid),
        h("div", "lbl", h("b", i.session ? "sess" : "", primary), h("small", null, secondary)),
        h("div", "num", h("b", null, i.cpu.toFixed(1) + "%"), h("br"), fmtMem(i.memMb)),
        btn
      ));
    }
  }
  function postKill(query) {
    return __async(this, null, function* () {
      const r = yield fetch(`${API}/procs/kill?${query}`, { method: "POST", cache: "no-store", headers: PANEL_HEADERS });
      return { ok: r.ok, body: yield r.json().catch(() => ({})) };
    });
  }
  function killInstance(i, label) {
    return __async(this, null, function* () {
      try {
        const { ok, body } = yield postKill("pid=" + i.pid);
        ok ? toast(t("panel.endedPid", { label, pid: i.pid }), "ok") : toast(body.error || t("panel.couldNotEnd"), "err");
      } catch (_) {
        toast(t("panel.pcUnreachable"), "err");
      }
      setTimeout(() => {
        loadSheet();
        loadProcs();
      }, 500);
    });
  }
  armButton($("psAll"), t("panel.tapToConfirm"), () => __async(void 0, null, function* () {
    const g = sheet == null ? void 0 : sheet.group;
    if (!g) return;
    try {
      const { ok, body } = yield postKill("name=" + encodeURIComponent(g.name));
      if (ok) {
        toast(t("panel.endedGroup", { killed: body.killed, title: g.title }) + (body.failed ? t("panel.failedCount", { n: body.failed }) : ""), "ok");
        closeSheet();
      } else toast(body.error || t("panel.couldNotEndThem"), "err");
    } catch (_) {
      toast(t("panel.pcUnreachable"), "err");
    }
    setTimeout(loadProcs, 500);
  }));
  $("psClose").addEventListener("click", () => {
    haptic();
    closeSheet();
  });
  function pushView(item) {
    var _a, _b, _c, _d, _e, _f, _g;
    const d = item.data;
    const v = { at: item.at };
    if (Array.isArray(d)) v.items = d;
    else if (d !== null && typeof d === "object") {
      v.value = (_b = (_a = d.value) != null ? _a : d.state) != null ? _b : d.status;
      v.title = (_d = (_c = d.title) != null ? _c : d.label) != null ? _d : d.name;
      v.sub = (_g = (_f = (_e = d.sub) != null ? _e : d.subtitle) != null ? _f : d.text) != null ? _g : d.message;
      v.unit = d.unit;
      v.color = d.color;
      v.icon = d.icon;
      v.items = Array.isArray(d.items) ? d.items : void 0;
      v.level = d.level;
      if (typeof d.progress === "number") v.progress = d.progress > 1 ? d.progress / 100 : d.progress;
      if (typeof d.min === "number") v.min = d.min;
      if (typeof d.max === "number") v.max = d.max;
      if (v.value === void 0 && !v.items && v.sub === void 0) v.value = JSON.stringify(d);
    } else v.value = d;
    return v;
  }
  function fmtValue(x) {
    if (typeof x === "number") return Math.abs(x) >= 100 ? String(Math.round(x)) : String(Math.round(x * 10) / 10);
    if (typeof x === "boolean") return x ? "On" : "Off";
    return x == null ? "\u2014" : String(x);
  }
  var LEVEL_COLOR = { ok: "#22c55e", success: "#22c55e", warn: "#f59e0b", warning: "#f59e0b", error: "#ef4444", fail: "#ef4444", failure: "#ef4444", info: "#60a5fa" };
  var levelOf = (v) => v.level || (typeof v.value === "string" ? /^(ok|pass(ed)?|success|green|up|online)$/i.test(v.value) ? "ok" : /^(fail(ed|ure)?|error|red|down|offline|broken)$/i.test(v.value) ? "error" : /^(running|pending|building|warn(ing)?|yellow)$/i.test(v.value) ? "warn" : "" : "");
  function handleNotify(d) {
    const level = d.level === "error" ? "err" : d.level === "ok" || d.level === "success" ? "ok" : d.level === "warn" ? "warn" : "";
    if (d.wake && nightOn) {
      wakeUntil = Date.now() + 3e4;
      setNight(false);
    }
    undim();
    toast(d.text || "", level, d.title || "", d.seconds || 5);
    if (d.vibrate !== false) buzz(level === "err" ? "0,90,90,90,90,160" : "0,70,110,70");
    D.notes.unshift({ title: d.title || "", text: d.text || "", level: d.level || "info", at: Date.now() });
    D.notes = D.notes.slice(0, 30);
    store.set("notes", D.notes);
    emit("notes");
    const raw = d.countdown;
    const countdown = typeof raw === "number" ? raw : typeof raw === "string" && raw.trim() !== "" ? Number(raw) : NaN;
    if (d.page != null) requestPage({ page: d.page, name: d.title || null, countdown: Number.isFinite(countdown) ? Math.min(30, Math.max(0, countdown)) : void 0 });
  }
  var approvals = [];
  var approvalShown = null;
  var answered = /* @__PURE__ */ new Set();
  var answeredCap = 50;
  var submitting = /* @__PURE__ */ new Set();
  function stillOpen(items) {
    return items.filter((x) => !answered.has(x.id));
  }
  var approvalBusy = false;
  function loadApprovals() {
    return __async(this, null, function* () {
      if (PREVIEW || approvalBusy) return;
      approvalBusy = true;
      try {
        approvals = stillOpen((yield api("/approvals", "GET", 8e3)).items || []);
      } catch (e) {
        const msg = e && e.message || String(e);
        if (!/abort|timeout/i.test(msg)) console.warn("approvals: list request failed:", msg);
        return;
      } finally {
        approvalBusy = false;
      }
      renderApproval();
    });
  }
  function renderApproval() {
    const a = approvals[0];
    const box = $("approval");
    if (!a) {
      box.hidden = true;
      approvalShown = null;
      return;
    }
    if (approvalShown !== a.id) {
      approvalShown = a.id;
      lastTouch = Date.now();
      undim();
      if (nightOn) {
        wakeUntil = Date.now() + 6e4;
        setNight(false);
      }
      buzz("0,120,80,120,80,240");
      $("apAllow").disabled = $("apDeny").disabled = $("apSkip").disabled = submitting.has(a.id);
    }
    const asking = a.kind === "question";
    $("apAllow").hidden = $("apDeny").hidden = asking;
    $("apSkip").hidden = !asking;
    $("apSource").textContent = a.source || "Claude Code";
    $("apProject").textContent = a.project || a.session || "";
    $("apCount").textContent = approvals.length > 1 ? t("panel.oneOfN", { n: approvals.length }) : "";
    $("apTool").textContent = a.tool;
    $("apDesc").textContent = a.description || "";
    $("apDetail").textContent = a.detail || "";
    $("apDetail").hidden = !a.detail;
    box.hidden = false;
    tickApproval();
  }
  function tickApproval() {
    const a = approvals[0];
    if (!a || $("approval").hidden) return;
    const left = a.expiresAt - Date.now();
    $("apTime").textContent = a.kind === "question" ? t("panel.answerInTerminal") : left > 0 ? t("panel.askedInTerminalIn", { time: fmtTime(left) }) : t("panel.askingInTerminal");
    if (left < -3e3) {
      approvals.shift();
      renderApproval();
    }
  }
  setInterval(tickApproval, 1e3);
  setInterval(() => {
    if (!PREVIEW && !document.hidden) loadApprovals();
  }, 5e3);
  function decide(decision) {
    return __async(this, null, function* () {
      const a = approvals[0];
      if (!a || submitting.has(a.id)) return;
      haptic();
      submitting.add(a.id);
      $("apAllow").disabled = $("apDeny").disabled = $("apSkip").disabled = true;
      let accepted = false;
      try {
        yield api(`/approvals/${encodeURIComponent(a.id)}?decision=${decision}`, "POST", 4e3);
        accepted = true;
        if (decision === "skip") toast(t("panel.questionWaiting"), "warn");
        else toast(t(decision === "allow" ? "panel.allowedTool" : "panel.deniedTool", { tool: a.tool }), decision === "allow" ? "ok" : "err");
      } catch (_) {
        toast(t("panel.alreadyAnswered"), "warn");
      } finally {
        submitting.delete(a.id);
      }
      if (!accepted) {
        if (approvals[0] && approvals[0].id === a.id) {
          $("apAllow").disabled = $("apDeny").disabled = $("apSkip").disabled = false;
        }
        return;
      }
      answered.add(a.id);
      if (answered.size > answeredCap) answered.delete(answered.values().next().value);
      approvals = approvals.filter((x) => x.id !== a.id);
      renderApproval();
    });
  }
  $("apAllow").addEventListener("click", () => decide("allow"));
  $("apDeny").addEventListener("click", () => decide("deny"));
  $("apSkip").addEventListener("click", () => decide("skip"));
  function handleEvent(e) {
    if (PREVIEW && (e.kind === "goto" || e.kind === "back" || e.kind === "reload")) return;
    if (e.kind === "approval" || e.kind === "approval-done") loadApprovals();
    else if (e.kind === "notify" && e.data) handleNotify(e.data);
    else if (e.kind === "goto" && e.data) requestPage(e.data);
    else if (e.kind === "back" && e.data) requestBack(e.data.rule);
    else if (e.kind === "refresh") {
      loadConfig();
      loadQuotas();
      loadWork();
      loadPush();
      loadWeather(true);
      loadCalendar();
    } else if (e.kind === "reload") location.reload();
  }
  var WIDGET_ICONS = {
    camera: "\u{1F4F9}",
    dictate: "\u{1F399}\uFE0F",
    spectrum: "\u{1F4F6}",
    "app-console": "\u{1F39B}\uFE0F",
    discord: "\u{1F4AC}",
    rules: "\u26A1",
    chargecare: "\u{1F50B}",
    nextup: "\u23ED\uFE0F",
    moon: "\u{1F319}",
    wordclock: "\u{1F524}",
    clock: "\u{1F552}",
    weather: "\u26C5",
    forecast: "\u{1F326}\uFE0F",
    media: "\u{1F3B5}",
    stat: "\u{1F4C8}",
    gauge: "\u23F2\uFE0F",
    chart: "\u{1F4CA}",
    meters: "\u{1F4BE}",
    gpu: "\u{1F3AE}",
    quotas: "\u2733\uFE0F",
    sessions: "\u{1F916}",
    github: "\u{1F419}",
    processes: "\u2699\uFE0F",
    shortcuts: "\u{1F39B}\uFE0F",
    button: "\u{1F518}",
    worldclock: "\u{1F30D}",
    calendar: "\u{1F4C5}",
    pomodoro: "\u{1F345}",
    countdown: "\u23F3",
    note: "\u{1F4DD}",
    command: "\u{1F4BB}",
    push: "\u{1F4E1}",
    inbox: "\u{1F4EC}",
    label: "\u{1F524}",
    analog: "\u{1F570}\uFE0F",
    progress: "\u{1F4C6}",
    stopwatch: "\u23F1\uFE0F",
    timer: "\u23F2\uFE0F",
    counter: "\u{1F522}",
    breathe: "\u{1FAC1}",
    quote: "\u{1F4AC}",
    checklist: "\u2705",
    battery: "\u{1F50B}",
    topprocs: "\u{1F525}",
    quotaring: "\u{1F3AF}",
    volume: "\u{1F50A}",
    sun: "\u{1F305}",
    air: "\u{1F343}",
    hackernews: "\u{1F4F0}",
    feeds: "\u{1F5DE}\uFE0F",
    photos: "\u{1F5BC}\uFE0F",
    exchange: "\u{1F4B1}",
    crypto: "\u{1FA99}",
    image: "\u{1F5BC}\uFE0F",
    pcswitch: "\u{1F5A5}\uFE0F"
  };
  var pager = $("pager");
  var pages = [];
  var mounted = [];
  var layoutKey = "";
  var curPage = 0;
  var lastHour12 = null;
  var isPortrait = () => window.innerHeight > window.innerWidth * 1.05;
  function portraitLayout(widgets) {
    const cols = 6, occ = [], pos = /* @__PURE__ */ new Map();
    const free = (x, y, w, h2) => {
      var _a;
      for (let r = y; r < y + h2; r++) for (let c = x; c < x + w; c++) if ((_a = occ[r]) == null ? void 0 : _a[c]) return false;
      return true;
    };
    const take = (x, y, w, h2) => {
      for (let r = y; r < y + h2; r++) {
        occ[r] = occ[r] || [];
        for (let c = x; c < x + w; c++) occ[r][c] = true;
      }
    };
    for (const w of [...widgets].sort((a, b) => a.y - b.y || a.x - b.x)) {
      const ww = Math.min(cols, w.w), hh = w.h;
      search: for (let y = 0; y < 200; y++) for (let x = 0; x + ww <= cols; x++) if (free(x, y, ww, hh)) {
        take(x, y, ww, hh);
        pos.set(w, { x, y, w: ww, h: hh });
        break search;
      }
    }
    return { pos, rows: Math.max(12, occ.length) };
  }
  function buildLayout() {
    var _a, _b, _c, _d, _e, _f, _g;
    const enabled = (cfg.pages || []).filter((p) => p.enabled !== false && Array.isArray(p.widgets));
    const next = enabled.length ? enabled : FALLBACK_PAGES;
    const portrait = isPortrait();
    const h12 = hour12();
    const key = JSON.stringify([next, cfg.shortcuts, (_a = cfg.display) == null ? void 0 : _a.showSeconds, (_b = cfg.display) == null ? void 0 : _b.hour12, h12, (_c = cfg.display) == null ? void 0 : _c.appearance, portrait, I18n == null ? void 0 : I18n.getLang()]);
    if (key === layoutKey) return;
    layoutKey = key;
    lastHour12 = h12;
    const prevId = (_d = pages[curPage]) == null ? void 0 : _d.id;
    pages = next;
    for (const m of mounted) {
      try {
        (_f = (_e = m.inst).destroy) == null ? void 0 : _f.call(_e);
      } catch (_) {
      }
    }
    mounted = [];
    closeSheet();
    pager.replaceChildren();
    pages.forEach((p, pi) => {
      var _a2, _b2, _c2;
      const grid = h("div", "grid");
      const pageAppearance = PhoneBoxAppearance.resolve((_a2 = cfg.display) == null ? void 0 : _a2.appearance, p.appearance);
      const pl = portrait ? portraitLayout(p.widgets) : null;
      if (pl) {
        grid.style.gridTemplateColumns = "repeat(6, minmax(0, 1fr))";
        grid.style.gridTemplateRows = `repeat(${pl.rows}, minmax(0, 1fr))`;
      }
      for (const w of p.widgets) {
        const def = W[w.type];
        if (!def) continue;
        const box = h("div", `w w-${w.type}${def.bare ? " bare" : " card"}`);
        const appearance = PhoneBoxAppearance.resolve((_b2 = cfg.display) == null ? void 0 : _b2.appearance, p.appearance, w.appearance);
        const at2 = (pl == null ? void 0 : pl.pos.get(w)) || w;
        box.style.gridArea = `${at2.y + 1} / ${at2.x + 1} / span ${at2.h} / span ${at2.w}`;
        grid.appendChild(box);
        const ctx = { page: p, w, o: w.options || {}, box, appearance };
        let inst;
        try {
          inst = def.create(box, ctx) || {};
        } catch (e) {
          box.replaceChildren(h("div", "empty", `${w.type}: ${e.message}`));
          inst = {};
        }
        PhoneBoxAppearance.widget(box, appearance);
        mounted.push({ pi, def: inst.needs ? __spreadProps(__spreadValues({}, def), { needs: inst.needs, always: (_c2 = inst.always) != null ? _c2 : def.always }) : def, inst, ctx, dirty: true });
      }
      const sec = h("section", "page", grid);
      PhoneBoxAppearance.page(sec, grid, pageAppearance);
      sec.dataset.id = p.id;
      pager.appendChild(sec);
    });
    const idx = Math.max(0, pages.findIndex((p) => p.id === prevId));
    if (pagePaused && (pages.length < 2 || pausedPageId && ((_g = pages[idx]) == null ? void 0 : _g.id) !== pausedPageId)) {
      pagePaused = false;
      pausedPageId = null;
    }
    buildDots();
    curPage = -1;
    goPage(idx, true);
    requestAnimationFrame(() => setActive(true));
  }
  function activeSet() {
    return /* @__PURE__ */ new Set([curPage - 1, curPage, curPage + 1]);
  }
  var pageOf = (kind) => mounted.filter((m) => m.pi === curPage && m.def.needs.includes(kind)).length > 0;
  var anyNeeds = (kind) => mounted.some((m) => m.def.needs.includes(kind));
  function runUpdate(m, kind, background = false) {
    var _a, _b;
    try {
      (_b = (_a = m.inst).update) == null ? void 0 : _b.call(_a, kind, background);
    } catch (e) {
      console.warn(m.ctx.w.type, e);
    }
  }
  function emit(kind) {
    const act = activeSet();
    for (const m of mounted) {
      if (!m.def.needs.includes(kind)) continue;
      if (act.has(m.pi)) runUpdate(m, kind);
      else if (m.def.always && kind === "tick") runUpdate(m, kind, true);
      else m.dirty = true;
    }
  }
  function setActive(all = false) {
    const act = activeSet();
    for (const m of mounted) {
      if ((m.dirty || all) && act.has(m.pi)) {
        m.dirty = false;
        for (const k of m.def.needs) runUpdate(m, k);
      }
    }
  }
  var pagePaused = false;
  var pausedPageId = null;
  var pagePauseBtn = null;
  var pageOverlayTimer = 0;
  function makeSvg(cls, d) {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    if (cls) svg.setAttribute("class", cls);
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS(ns, "path");
    path.setAttribute("d", d);
    svg.appendChild(path);
    return svg;
  }
  function showPagePauseFeedback(paused) {
    const overlay = $("pagePauseOverlay");
    if (!overlay) return;
    if (pageOverlayTimer) {
      clearTimeout(pageOverlayTimer);
      pageOverlayTimer = 0;
    }
    overlay.replaceChildren(h(
      "div",
      "rot-overlay-icon",
      makeSvg("", paused ? "M6 5h4v14H6zM14 5h4v14h-4z" : "M8 5v14l11-7z")
    ));
    overlay.classList.remove("show");
    void overlay.offsetWidth;
    overlay.classList.add("show");
    pageOverlayTimer = setTimeout(() => {
      overlay.classList.remove("show");
      pageOverlayTimer = 0;
    }, 2e3);
  }
  function syncPagePauseUi() {
    const dots = $("dots");
    if (dots) dots.classList.toggle("paused", pagePaused);
    if (pagePauseBtn) {
      pagePauseBtn.classList.toggle("on", pagePaused);
      pagePauseBtn.setAttribute("aria-label", t("panel.pagePause"));
      pagePauseBtn.setAttribute("aria-pressed", String(pagePaused));
      pagePauseBtn.title = pagePaused ? t("panel.pagePaused") : t("panel.pagePause");
    }
  }
  function setPagePaused(next, { feedback = false, resume = true } = {}) {
    var _a, _b;
    const val = !!(next && pages.length >= 2);
    if (val === pagePaused) return pagePaused;
    pagePaused = val;
    pausedPageId = pagePaused ? (_b = (_a = pages[curPage]) == null ? void 0 : _a.id) != null ? _b : null : null;
    lastTouch = Date.now();
    syncPagePauseUi();
    if (feedback) {
      haptic();
      showPagePauseFeedback(pagePaused);
    }
    if (pagePaused && navQueue.length) navQueue = navQueue.filter((r) => r.kind !== "home");
    if (resume) pump();
    return pagePaused;
  }
  function togglePagePaused() {
    if (pages.length < 2) return false;
    return setPagePaused(!pagePaused, { feedback: true });
  }
  function buildDots() {
    const dots = $("dots");
    if (pages.length < 2) {
      pagePauseBtn = null;
      dots.replaceChildren();
      dots.classList.remove("paused");
      dots.hidden = true;
      return;
    }
    pagePauseBtn = h(
      "button",
      "page-pause",
      makeSvg("i-pause", "M7 5h4v14H7zM13 5h4v14h-4z"),
      makeSvg("i-play", "M8 5v14l11-7z")
    );
    pagePauseBtn.type = "button";
    pagePauseBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      togglePagePaused();
    });
    dots.replaceChildren(...pages.map(() => h("i")), pagePauseBtn);
    dots.hidden = false;
    syncPagePauseUi();
  }
  function updateDots() {
    $("dots").querySelectorAll("i").forEach((d, i) => d.classList.toggle("on", i === curPage));
  }
  var snapTimer = 0;
  function goPage(i, instant = false) {
    i = Math.max(0, Math.min(pages.length - 1, i));
    if (curPage >= 0 && i !== curPage && pagePaused) setPagePaused(false, { feedback: false, resume: false });
    if (!instant) {
      pager.scrollTo({ left: i * window.innerWidth, behavior: "smooth" });
      return;
    }
    pager.style.scrollSnapType = "none";
    pager.scrollLeft = i * window.innerWidth;
    onScroll();
    clearTimeout(snapTimer);
    snapTimer = setTimeout(() => pager.style.scrollSnapType = "", 120);
  }
  function gotoPageRef(ref) {
    const n = resolvePage(ref);
    if (n < 0) return -1;
    lastTouch = Date.now();
    goPage(n, Math.abs(n - curPage) > 1);
    return n;
  }
  var procsSort = "cpu";
  var procsSorter = null;
  function registerProcessesSorter(fn) {
    procsSorter = typeof fn === "function" ? fn : null;
    if (procsSorter) procsSorter(procsSort);
  }
  function currentProcessesSort() {
    return procsSort;
  }
  function hasProcessesPage() {
    return resolvePage("procs") >= 0 || resolvePage("processes") >= 0 || pages.some((p) => (p.widgets || []).some((w) => w.type === "processes"));
  }
  function gotoProcesses(sortTarget = "cpu") {
    procsSort = sortTarget === "mem" ? "mem" : "cpu";
    let idx = resolvePage("procs");
    if (idx < 0) idx = resolvePage("processes");
    if (idx < 0) idx = pages.findIndex((p) => (p.widgets || []).some((w) => w.type === "processes"));
    if (idx >= 0) gotoPageRef(idx + 1);
    if (procsSorter) procsSorter(procsSort);
  }
  var resolvePage = (ref) => {
    const n = typeof ref === "number" ? ref - 1 : /^\d+$/.test(String(ref)) ? +ref - 1 : pages.findIndex((p) => p.id === ref || p.title.toLowerCase() === String(ref).toLowerCase());
    return n >= 0 && n < pages.length ? n : -1;
  };
  var homeIndex = () => {
    var _a;
    const id = (_a = cfg.display) == null ? void 0 : _a.homePage;
    const i = id ? pages.findIndex((p) => p.id === id) : -1;
    return i >= 0 ? i : 0;
  };
  var ruleHold = null;
  var navQueue = [];
  var navCount = null;
  var navTimer = 0;
  var lastAutoSwitch = 0;
  var lastNav = 0;
  var dsp = () => cfg.display || {};
  var pageLabel = (i) => {
    const p = pages[i];
    return p ? `${p.icon || ""} ${p.title}`.trim() : "";
  };
  function requestPage(d) {
    var _a;
    if (PREVIEW) return;
    const page = resolvePage(d.page);
    if (page < 0) return;
    const rule = d.rule || null;
    if (rule) {
      const back = navQueue.find((r) => r.kind === "back" && r.rule === rule);
      navQueue = navQueue.filter((r) => r.rule !== rule);
      if (back && (ruleHold == null ? void 0 : ruleHold.rule) === rule && curPage === ruleHold.page) {
        ruleHold.at = Date.now();
        return pump();
      }
    }
    navQueue.push({
      kind: "goto",
      rule,
      name: d.name || null,
      detail: d.detail || "",
      page,
      hold: !!(d.hold && rule),
      priority: (_a = d.priority) != null ? _a : 5,
      countdown: d.countdown,
      at: Date.now()
    });
    soon();
  }
  function soon() {
    if (!navTimer) navTimer = setInterval(pump, 250);
  }
  function requestBack(rule) {
    if (PREVIEW || !rule) return;
    const queued = navQueue.findIndex((r) => r.kind === "goto" && r.rule === rule);
    if (queued >= 0) {
      navQueue.splice(queued, 1);
      return pump();
    }
    if (!ruleHold || ruleHold.rule !== rule || navQueue.some((r) => r.kind === "back" && r.rule === rule)) return;
    navQueue.push({ kind: "back", rule, name: ruleHold.name, page: ruleHold.from, priority: ruleHold.priority, at: Date.now() });
    soon();
  }
  var idleLimit = () => {
    var _a, _b, _c;
    return (_c = (_b = (_a = pages[curPage]) == null ? void 0 : _a.idleSec) != null ? _b : dsp().idleReturnSec) != null ? _c : 90;
  };
  function idleDue() {
    var _a;
    if (pagePaused) return false;
    const idle = idleLimit();
    if (!(idle > 0)) return false;
    const maxHold = ((_a = dsp().holdMaxMin) != null ? _a : 30) * 6e4;
    const held = ruleHold && curPage === ruleHold.page && (!maxHold || Date.now() - ruleHold.at < maxHold);
    return !held && Date.now() - Math.max(lastTouch, lastNav) > idle * 1e3 && (curPage !== homeIndex() || !!sheet || !$("overview").hidden);
  }
  function softGo(i) {
    if (i === curPage) return;
    if (Math.abs(i - curPage) === 1) {
      goPage(i);
      return;
    }
    pager.classList.add("fade");
    const pausedBefore = pagePaused;
    setTimeout(() => {
      pager.classList.remove("fade");
      if (pagePaused && !pausedBefore) return;
      goPage(i, true);
    }, 320);
  }
  function perform(req) {
    navQueue = navQueue.filter((r) => r !== req);
    navCount = null;
    if (req.kind === "goto") {
      const from = ruleHold && curPage === ruleHold.page ? ruleHold.from : curPage;
      navQueue = navQueue.filter((r) => r.kind !== "back");
      if (req.hold) ruleHold = { rule: req.rule, name: req.name, page: req.page, from, at: Date.now(), priority: req.priority };
      else if (ruleHold && req.page !== ruleHold.page) ruleHold = null;
      softGo(req.page);
    } else if (req.kind === "back") {
      const h2 = ruleHold;
      ruleHold = null;
      if (h2 && curPage === h2.page && h2.from !== h2.page) softGo(h2.from);
    } else {
      ruleHold = null;
      closeSheet();
      closeOverview();
      softGo(homeIndex());
    }
    if (req.kind !== "home") lastAutoSwitch = Date.now();
    lastNav = Date.now();
    renderNav();
    if (navQueue.length) setTimeout(pump, 0);
  }
  function dismiss(req) {
    haptic();
    navQueue = navQueue.filter((r) => r !== req);
    if (req.kind === "home") lastTouch = Date.now();
    if (req.kind === "back" && (ruleHold == null ? void 0 : ruleHold.rule) === req.rule) ruleHold = null;
    navCount = null;
    pump();
  }
  function nextRequest() {
    const hold2 = ruleHold && curPage === ruleHold.page ? ruleHold : null;
    if (ruleHold && !hold2 && navQueue.some((r) => r.kind === "back" && r.rule === ruleHold.rule)) ruleHold = null;
    navQueue = navQueue.filter((r) => r.kind === "back" ? hold2 && hold2.rule === r.rule : r.kind === "home" ? idleDue() : true);
    for (const r of navQueue.filter((r2) => r2.kind === "goto" && r2.page === curPage)) {
      if (r.hold && (!hold2 || r.priority >= hold2.priority)) ruleHold = { rule: r.rule, name: r.name, page: r.page, from: hold2 ? hold2.from : curPage, at: Date.now(), priority: r.priority };
      navQueue = navQueue.filter((x) => x !== r);
    }
    const ending = hold2 && navQueue.some((r) => r.kind === "back" && r.rule === hold2.rule);
    const blocked = (r) => r.kind === "goto" && hold2 && !ending && r.priority < hold2.priority;
    const order = { goto: 0, back: 1, home: 2 };
    return navQueue.filter((r) => !blocked(r)).sort((a, b) => order[a.kind] - order[b.kind] || b.priority - a.priority || a.at - b.at)[0] || null;
  }
  function waitReason(req) {
    var _a, _b;
    if (!$("approval").hidden) return "after the permission prompt";
    if (req.kind === "home") return "";
    if (pagePaused) return t("panel.pagePausedWait");
    const grace = ((_a = dsp().touchGraceSec) != null ? _a : 20) * 1e3;
    if (Date.now() - lastUserTouch < grace) return "waits until you are done";
    if (sheet || !$("overview").hidden) return "waits until you are done";
    const dwell = ((_b = dsp().minDwellSec) != null ? _b : 15) * 1e3 - (Date.now() - lastAutoSwitch);
    if (dwell > 0) return `in ${Math.ceil(dwell / 1e3)} s`;
    return "";
  }
  function pump() {
    var _a, _b;
    const req = nextRequest();
    if (!req) {
      navCount = null;
      renderNav();
      clearInterval(navTimer);
      navTimer = 0;
      return;
    }
    if (!navTimer) navTimer = setInterval(pump, 250);
    const why = waitReason(req);
    if (why) {
      navCount = null;
      renderNav(req, why);
      return;
    }
    const seconds = nightOn ? 0 : (_b = (_a = req.countdown) != null ? _a : dsp().switchCountdownSec) != null ? _b : 3;
    if (!navCount || navCount.req !== req) {
      if (seconds <= 0) return perform(req);
      navCount = { req, until: Date.now() + seconds * 1e3, total: seconds };
      buzz("0,40");
    }
    if (Date.now() >= navCount.until) return perform(req);
    renderNav(req);
  }
  var navShown = null;
  var navWoken = null;
  function renderNav(req = null, why = "") {
    const card = $("navCard"), chip = $("navChip");
    if (!req) {
      card.classList.remove("on");
      chip.classList.remove("on");
      navShown = null;
      navWoken = null;
      return;
    }
    const wakeKey = why ? req : navCount;
    if (wakeKey !== navWoken) {
      navWoken = wakeKey;
      undim();
    }
    const name = req.name || (req.kind === "home" ? t("panel.nobodyAround") : req.kind === "back" ? t("panel.done") : t("panel.pageSwitch"));
    const target = req.kind === "home" ? pageLabel(homeIndex()) : pageLabel(req.page);
    const more = navQueue.length > 1 ? ` +${navQueue.length - 1}` : "";
    if (why) {
      card.classList.remove("on");
      chip.classList.add("on");
      navShown = null;
      $("ncText").textContent = `${name} \u2192 ${target}${more}`;
      $("ncWhy").textContent = why;
      $("ncGo").onclick = () => {
        haptic();
        perform(req);
      };
      $("ncX").onclick = () => dismiss(req);
      return;
    }
    chip.classList.remove("on");
    if (navShown !== navCount) {
      navShown = navCount;
      $("nvName").textContent = name;
      $("nvLine").textContent = req.kind === "goto" ? t("panel.switchingTo", { target }) : t("panel.backTo", { target });
      $("nvDetail").textContent = req.detail && req.detail !== "test" ? req.detail : more ? t("panel.moreWaiting", { n: navQueue.length - 1 }) : "";
      const ring = $("nvRing");
      ring.style.animation = "none";
      void ring.getBoundingClientRect();
      ring.style.animation = `nav-ring ${Math.max(0.1, (navCount.until - Date.now()) / 1e3)}s linear forwards`;
      $("nvStay").onclick = () => dismiss(req);
      $("nvGo").onclick = () => {
        haptic();
        perform(req);
      };
      card.classList.add("on");
    }
    $("nvNum").textContent = Math.max(1, Math.ceil((navCount.until - Date.now()) / 1e3));
  }
  function toggleRulesPause() {
    return __async(this, null, function* () {
      haptic();
      const paused = rulesPaused && rulesPaused > Date.now();
      try {
        const r = yield api(`/rules/pause?minutes=${paused ? 0 : 60}`, "POST", 4e3);
        rulesPaused = r.pausedUntil || null;
        if (!rulesPaused) navQueue = navQueue.filter((x) => x.kind === "home");
        toast(rulesPaused ? t("panel.rulesPausedToast") : t("panel.rulesResumedToast"), "ok");
      } catch (_) {
        toast(t("panel.pcNoAnswer"), "warn");
      }
      renderRulesBtn();
    });
  }
  function renderRulesBtn() {
    const b = $("ovRules");
    if (!b) return;
    const paused = rulesPaused && rulesPaused > Date.now();
    b.hidden = PREVIEW || !online;
    b.classList.toggle("on", !!paused);
    b.replaceChildren(icon(paused ? "play" : "pause", "m"), paused ? t("panel.rulesPausedUntil", { time: fmtHM(new Date(rulesPaused)) }) : t("panel.pauseRules1h"));
  }
  var titleTimer = 0;
  function flashTitle() {
    const p = pages[curPage];
    if (!p || pages.length < 2) return;
    const t2 = $("ptitle");
    t2.textContent = `${p.icon || ""} ${p.title}`.trim();
    t2.classList.add("on");
    clearTimeout(titleTimer);
    titleTimer = setTimeout(() => t2.classList.remove("on"), 900);
  }
  function onScroll() {
    const p = Math.round(pager.scrollLeft / window.innerWidth);
    if (p === curPage) return;
    const prev = curPage;
    curPage = p;
    if (prev >= 0 && pagePaused) setPagePaused(false, { feedback: false, resume: false });
    updateDots();
    flashTitle();
    setActive();
    if (sheet) closeSheet();
    if (pageOf("procs")) loadProcs();
  }
  pager.addEventListener("scroll", onScroll, { passive: true });
  function openOverview() {
    haptic();
    const ov = $("overview");
    const tile = (p, i) => {
      const map = h("div", "ov-map", p.widgets.map((w) => {
        const b = h("span", null, WIDGET_ICONS[w.type] || "\u25AB\uFE0F");
        b.style.gridArea = `${w.y + 1} / ${w.x + 1} / span ${w.h} / span ${w.w}`;
        return b;
      }));
      const t2 = h("button", "ov-tile" + (i === curPage ? " on" : ""), map, h("div", "ov-name", h("b", null, `${i + 1}`), ` ${p.icon || ""} ${p.title}`));
      t2.addEventListener("click", (e) => {
        e.stopPropagation();
        haptic();
        closeOverview();
        goPage(i, true);
      });
      return t2;
    };
    $("ovGrid").replaceChildren(...pages.map(tile));
    renderRulesBtn();
    const pcs = pairedPcs();
    $("ovPcs").replaceChildren(...pcs.length > 1 ? pcs.map((pc) => {
      const b = h("button", "ov-pc" + (pc.active ? " on" : ""), "\u{1F5A5}\uFE0F " + (pc.name || t("panel.computer")));
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        switchPc(pc);
      });
      return b;
    }) : []);
    $("ovGrid").style.setProperty("--n", Math.min(4, Math.ceil(Math.sqrt(pages.length * 1.6))));
    ov.hidden = false;
  }
  window.openOverview = openOverview;
  function pairedPcs() {
    try {
      return (bridge == null ? void 0 : bridge.pcs) ? JSON.parse(bridge.pcs()) : [];
    } catch (_) {
      return [];
    }
  }
  function switchPc(pc) {
    if (!pc || pc.active || !(bridge == null ? void 0 : bridge.selectPc)) return;
    haptic();
    toast(t("panel.switchingPc", { name: pc.name || t("panel.otherComputer") }));
    setTimeout(() => bridge.selectPc(pc.id), 300);
  }
  function closeOverview() {
    $("overview").hidden = true;
  }
  $("overview").addEventListener("click", closeOverview);
  $("ovRules").addEventListener("click", (e) => {
    e.stopPropagation();
    toggleRulesPause();
  });
  var dotsHoldTimer = 0;
  var dotsHoldStart = null;
  var heldDots = false;
  function clearDotsHold() {
    if (dotsHoldTimer) {
      clearTimeout(dotsHoldTimer);
      dotsHoldTimer = 0;
    }
    dotsHoldStart = null;
  }
  $("dots").addEventListener("pointerdown", (e) => {
    heldDots = false;
    clearDotsHold();
    if (pages.length < 2 || dimmed || document.body.classList.contains("waking")) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (e.target.closest(".page-pause")) return;
    dotsHoldStart = [e.clientX, e.clientY];
    dotsHoldTimer = setTimeout(() => {
      dotsHoldTimer = 0;
      dotsHoldStart = null;
      heldDots = true;
      togglePagePaused();
    }, 450);
  });
  $("dots").addEventListener("pointermove", (e) => {
    if (dotsHoldStart && Math.hypot(e.clientX - dotsHoldStart[0], e.clientY - dotsHoldStart[1]) > 10) clearDotsHold();
  });
  ["pointerup", "pointercancel", "pointerleave"].forEach((ev) => $("dots").addEventListener(ev, clearDotsHold));
  window.addEventListener("blur", clearDotsHold);
  $("dots").addEventListener("click", (e) => {
    if (heldDots) {
      heldDots = false;
      if (!e.target.closest(".page-pause")) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
    }
    if (e.target.closest(".page-pause")) return;
    openOverview();
  });
  var pressTimer = 0;
  var pressAt = null;
  pager.addEventListener("pointerdown", (e) => {
    if (!e.target.classList.contains("grid") && !e.target.classList.contains("page")) return;
    pressAt = [e.clientX, e.clientY];
    pressTimer = setTimeout(() => {
      pressAt = null;
      openOverview();
    }, 550);
  });
  pager.addEventListener("pointermove", (e) => {
    if (pressAt && Math.hypot(e.clientX - pressAt[0], e.clientY - pressAt[1]) > 12) {
      clearTimeout(pressTimer);
      pressAt = null;
    }
  });
  ["pointerup", "pointercancel"].forEach((ev) => pager.addEventListener(ev, () => {
    clearTimeout(pressTimer);
    pressAt = null;
  }));
  var swipeStartX = 0;
  var swipeStartY = 0;
  var swipeStartPage = 0;
  var swipeStartTime = 0;
  var swipeTracking = false;
  pager.addEventListener("touchstart", (e) => {
    var _a, _b;
    swipeTracking = false;
    if (e.touches.length !== 1 || pages.length < 2) return;
    if (volDragging || ((_b = (_a = e.target).closest) == null ? void 0 : _b.call(_a, "button, input, textarea, select, a, [contenteditable], .s-list, .vb, .radio-carousel-track, .ac-dial"))) return;
    swipeStartX = e.touches[0].clientX;
    swipeStartY = e.touches[0].clientY;
    swipeStartPage = curPage;
    swipeStartTime = Date.now();
    swipeTracking = true;
  }, { passive: true });
  pager.addEventListener("touchend", (e) => {
    if (!swipeTracking || !e.changedTouches || e.changedTouches.length !== 1 || pages.length < 2) {
      swipeTracking = false;
      return;
    }
    swipeTracking = false;
    const dx = e.changedTouches[0].clientX - swipeStartX;
    const dy = e.changedTouches[0].clientY - swipeStartY;
    const dt = Date.now() - swipeStartTime;
    if (dt < 700 && Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      if (dx < 0 && swipeStartPage === pages.length - 1 && curPage === pages.length - 1) {
        haptic();
        goPage(0, true);
      } else if (dx > 0 && swipeStartPage === 0 && curPage === 0) {
        haptic();
        goPage(pages.length - 1, true);
      }
    }
  }, { passive: true });
  pager.addEventListener("touchcancel", () => {
    swipeTracking = false;
  }, { passive: true });
  window.onAndroidKey = (k) => {
    lastTouch = lastUserTouch = Date.now();
    if (nightOn) {
      wakeUntil = Date.now() + 3e4;
      setNight(false);
      return;
    }
    if (!$("overview").hidden) closeOverview();
    if (k === "next") goPage(curPage + 1 >= pages.length ? 0 : curPage + 1, true);
    else if (k === "prev") goPage(curPage - 1 < 0 ? pages.length - 1 : curPage - 1, true);
  };
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") window.onAndroidKey("next");
    else if (e.key === "ArrowLeft") window.onAndroidKey("prev");
    else if (e.key === "Escape" || e.key === "o") $("overview").hidden ? openOverview() : closeOverview();
  });
  window.onAndroidBack = () => {
    if (!$("approval").hidden) return;
    if (closeSessionDetails()) return;
    if (!$("overview").hidden) closeOverview();
    else if (sheet) closeSheet();
    else if (curPage !== homeIndex()) goPage(homeIndex(), true);
    else openOverview();
  };
  window.addEventListener("resize", () => {
    buildLayout();
    goPage(curPage, true);
  });
  ["pointerdown", "touchstart"].forEach((ev) => document.addEventListener(ev, (e) => {
    var _a, _b;
    if (dimmed) wakeFromDim();
    if ((_b = (_a = e.target) == null ? void 0 : _a.closest) == null ? void 0 : _b.call(_a, "#navCard, #navChip")) return;
    lastTouch = lastUserTouch = Date.now();
    if (navQueue.length) {
      navQueue = navQueue.filter((r) => r.kind !== "home");
      pump();
    }
    if (nightOn) {
      wakeUntil = Date.now() + 3e4;
      setNight(false);
    }
  }, { passive: true, capture: true }));
  function parseHM(s) {
    const [hh, mm] = (s || "0:0").split(":").map(Number);
    return hh * 60 + (mm || 0);
  }
  function isNight(now) {
    const n = cfg.night || {};
    if (!n.enabled) return false;
    const t2 = now.getHours() * 60 + now.getMinutes();
    const a = parseHM(n.start), b = parseHM(n.end);
    return a <= b ? t2 >= a && t2 < b : t2 >= a || t2 < b;
  }
  function setNight(on) {
    if (on === nightOn) return;
    nightOn = on;
    document.body.classList.toggle("night", on);
    applyBrightness(true);
  }
  var lux = null;
  var darkSince = 0;
  var darkRoom = false;
  var lastBrightness = null;
  var luxToBrightness = (l) => Math.max(0.05, Math.min(1, 0.05 + 0.95 * Math.log10(l + 1) / 3));
  function applyBrightness(force = false) {
    var _a, _b, _c;
    if (!bridge) return;
    let v = -1;
    if (nightOn) v = (_b = (_a = cfg.night) == null ? void 0 : _a.brightness) != null ? _b : 0.02;
    else if (((_c = cfg.display) == null ? void 0 : _c.autoBrightness) && lux != null) v = luxToBrightness(lux);
    if (!force && lastBrightness != null && v >= 0 && lastBrightness >= 0 && Math.abs(v - lastBrightness) < 0.04) return;
    lastBrightness = v;
    try {
      bridge.setBrightness(v);
    } catch (_) {
    }
  }
  window.onAndroidSensor = (kind, value) => {
    var _a;
    if (kind === "light") {
      lux = +value;
      if (lux < 3) {
        darkSince = darkSince || Date.now();
      } else darkSince = 0;
      if (darkRoom && lux > 15) darkRoom = false;
      applyBrightness();
    } else if (kind === "proximity" && value === true && ((_a = cfg.display) == null ? void 0 : _a.proximityWake) !== false && (nightOn || dimmed)) {
      undim();
      if (!nightOn) return;
      wakeUntil = Date.now() + 3e4;
      setNight(false);
    }
  };
  var SHIFT = [[0, 0], [1, 0], [2, 1], [1, 2], [0, 2], [-1, 1], [-2, 0], [-1, -1], [0, -2], [1, -1]];
  var NIGHT_SHIFT = [[0, 0], [4, -3], [-4, 3], [3, 4], [-4, -2], [2, -4], [-2, 2], [4, 1], [-3, -4], [1, 3]];
  var SHIFT_MS = 12e4;
  var shiftStep = -1;
  var lastWake = Date.now();
  var dimmed = false;
  function undim() {
    lastWake = Date.now();
    if (!dimmed) return;
    dimmed = false;
    document.body.classList.remove("dimmed");
  }
  function wakeFromDim() {
    const body = document.body.classList;
    body.add("waking");
    undim();
    const done = () => {
      clearTimeout(fallback);
      ["pointerup", "pointercancel"].forEach((t2) => document.removeEventListener(t2, done, true));
      setTimeout(() => body.remove("waking"), 300);
    };
    const fallback = setTimeout(done, 3e3);
    ["pointerup", "pointercancel"].forEach((t2) => document.addEventListener(t2, done, true));
  }
  function applyBurnIn() {
    const d = cfg.display || {};
    const shift = d.pixelShift === true && !PREVIEW;
    document.body.classList.toggle("shifted", shift);
    const step = shift ? Math.floor(Date.now() / SHIFT_MS) % SHIFT.length : -1;
    if (step !== shiftStep) {
      shiftStep = step;
      const [x, y] = step < 0 ? [0, 0] : SHIFT[step];
      const [nx, ny] = step < 0 ? [0, 0] : NIGHT_SHIFT[step];
      const root = document.documentElement.style;
      root.setProperty("--shift-x", `${x}px`);
      root.setProperty("--shift-y", `${y}px`);
      root.setProperty("--night-x", `${nx}vmin`);
      root.setProperty("--night-y", `${ny}vmin`);
    }
    const after = Math.max(0, Math.floor(+d.idleDimMin || 0)) * 6e4;
    const dim = after > 0 && !PREVIEW && !nightOn && $("approval").hidden && Date.now() - Math.max(lastTouch, lastNav, lastWake) > after;
    if (dim !== dimmed) {
      dimmed = dim;
      document.body.classList.toggle("dimmed", dim);
    }
  }
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) undim();
  });
  function tick() {
    var _a, _b;
    if (lastHour12 !== null && hour12() !== lastHour12) {
      buildLayout();
      renderRulesBtn();
    }
    const now = /* @__PURE__ */ new Date();
    $("nClock").textContent = fmtHM(now);
    $("nDate").textContent = now.toLocaleDateString(LOCALE, { weekday: "long", day: "numeric", month: "long" });
    if (darkSince && Date.now() - darkSince > 3e4) darkRoom = true;
    const dark = darkRoom && ((_a = cfg.display) == null ? void 0 : _a.nightWhenDark) === true;
    setNight((isNight(now) || dark) && Date.now() > wakeUntil);
    if (!PREVIEW && idleDue() && !navQueue.some((r) => r.kind === "home")) {
      if (curPage === homeIndex()) {
        closeSheet();
        closeOverview();
        lastNav = Date.now();
      } else {
        navQueue.push({ kind: "home", at: Date.now(), priority: -1 });
        pump();
      }
    }
    applyBurnIn();
    document.body.classList.toggle("controls-top", ((_b = cfg.display) == null ? void 0 : _b.controlsTop) === true);
    if (!nightOn) emit("tick");
    setTimeout(tick, 1e3 - Date.now() % 1e3 + 5);
  }
  function applyDisplay() {
    const d = cfg.display || {};
    const langChanged = I18n ? I18n.setLang(d.language || "auto") : false;
    LOCALE = I18n ? I18n.getLocale() : "en-GB";
    I18n == null ? void 0 : I18n.applyDom();
    document.body.dataset.theme = ["amoled", "midnight", "warm", "graphite"].includes(d.theme) ? d.theme : "default";
    const accent = hexToRgb(d.accent);
    const before = DEFAULT_AMBIENT;
    DEFAULT_AMBIENT = accent || "45, 212, 191";
    document.documentElement.style.setProperty("--accent", `rgb(${DEFAULT_AMBIENT})`);
    artTint = d.artTint !== false;
    if (before !== DEFAULT_AMBIENT || !artTint) setAmbient(artTint ? currentArtColor : null);
    if (langChanged) {
      buildLayout();
      renderApproval();
    }
    renderRulesBtn();
    if (PREVIEW || !bridge) return;
    try {
      bridge.setVolumeKeys && bridge.setVolumeKeys(d.volumeKeys !== false);
    } catch (_) {
    }
    try {
      bridge.setPinned && bridge.setPinned(d.pin === true);
    } catch (_) {
    }
    try {
      bridge.setOrientation && bridge.setOrientation(["portrait", "auto"].includes(d.orientation) ? d.orientation : "landscape");
    } catch (_) {
    }
    try {
      bridge.setHomeScreen && bridge.setHomeScreen(d.homeScreen === true);
    } catch (_) {
    }
    applyBrightness(true);
  }
  function loadConfig() {
    return __async(this, null, function* () {
      if (PREVIEW) return;
      try {
        const r = yield api("/config");
        const before = JSON.stringify(cfg);
        cfg = __spreadValues(__spreadValues({}, DEFAULT_CFG), r.config);
        cfgVersion = r.version;
        if (JSON.stringify(cfg) !== before) {
          store.set("cfg", cfg);
          buildLayout();
          applyDisplay();
          loadWeather();
        }
      } catch (_) {
      }
    });
  }
  var localDay = (ms) => {
    const d = new Date(ms);
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()).getTime();
  };
  function loadCalendar() {
    return __async(this, null, function* () {
      try {
        const cal = yield api("/calendar");
        cal.events = (cal.events || []).map((e) => e.allDay ? __spreadProps(__spreadValues({}, e), { start: localDay(e.start), end: localDay(e.end) }) : e).sort((a, b) => a.start - b.start);
        D.calendar = cal;
        emit("calendar");
      } catch (_) {
      }
    });
  }
  function loadQuotas() {
    return __async(this, null, function* () {
      try {
        D.quotas = yield api("/quotas");
        emit("quotas");
      } catch (_) {
      }
    });
  }
  function applyWork(w) {
    D.work = w;
    notifyTransitions(w.sessions || []);
    emit("work");
  }
  function loadWork() {
    return __async(this, null, function* () {
      try {
        applyWork(yield api("/work"));
      } catch (_) {
      }
    });
  }
  function loadProcs() {
    return __async(this, null, function* () {
      try {
        D.procs = yield api("/procs?top=150");
        emit("procs");
      } catch (_) {
      }
    });
  }
  function loadPush() {
    return __async(this, null, function* () {
      try {
        const r = yield api("/push");
        D.push = r.items || {};
        pushVersion = r.version;
        emit("push");
      } catch (_) {
      }
    });
  }
  function setOnline(on) {
    document.body.classList.toggle("offline", !on);
    if (on && online !== true) {
      loadConfig();
      loadQuotas();
      loadWork();
      loadPush();
      loadApprovals();
      loadCalendar();
    }
    const changed = online !== on;
    online = on;
    if (changed) emit("state");
  }
  function applyState(s, replayGen = null) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
    lastStateAt = Date.now();
    D.state = s;
    media = s.media ? __spreadProps(__spreadValues({}, s.media), { at: performance.now() }) : null;
    setOnline(true);
    if (s.cfgVersion !== void 0 && cfgVersion !== null && s.cfgVersion !== cfgVersion) loadConfig();
    if (s.pushVersion !== void 0 && s.pushVersion !== pushVersion) loadPush();
    const fresh = s.ts == null || s.ts >= stateTs;
    if (fresh || replayGen === evGen) for (const e of s.events || []) evOffer(e);
    if (fresh) {
      stateTs = (_a = s.ts) != null ? _a : stateTs;
      if (evSeq != null && s.evSeq != null && s.evSeq < evSeq) {
        evSeen.clear();
        evQueue = [];
        evDrop = 0;
        evReplay = true;
        evGen++;
        evSeq = 0;
      }
      evSeq = Math.max(evSeq != null ? evSeq : 0, (_b = s.evSeq) != null ? _b : 0);
    }
    if (ruleHold && Array.isArray(s.rules) && !s.rules.includes(ruleHold.rule) && Date.now() - ruleHold.at > 8e3) requestBack(ruleHold.rule);
    rulesPaused = s.rulesPaused || null;
    if (!$("overview").hidden) renderRulesBtn();
    {
      const pc = s.pc;
      if (pc) {
        pushHist("cpu", pc.cpu);
        pushHist("gpu", (_c = pc.gpu) == null ? void 0 : _c.util);
        pushHist("ram", pc.ramUsedGb);
        const mem = gpuMem(pc.gpu);
        pushHist("vram", mem ? mem.used / mem.total * 100 : 0);
        pushHist("down", pc.netDownBps);
        pushHist("up", pc.netUpBps);
        pushHist("ping", (_d = s.ping) == null ? void 0 : _d.ms);
        pushHist("gputemp", (_e = pc.gpu) == null ? void 0 : _e.temp);
        pushHist("cputemp", pc.cpuTemp);
        pushHist("hotspot", (_f = pc.gpu) == null ? void 0 : _f.hotSpot);
        pushHist("gpupower", (_i = (_g = pc.gpu) == null ? void 0 : _g.power) != null ? _i : (_h = pc.gpu) == null ? void 0 : _h.powerPct);
        pushHist("gpuclock", (_j = pc.gpu) == null ? void 0 : _j.clock);
      }
    }
    emit("state");
    return fresh || replayGen === evGen;
  }
  var streamOn = false;
  var lastStateAt = 0;
  window.onAgentStream = (event, data) => {
    if (event === "open") {
      streamOn = true;
      evPre = [];
      return;
    }
    if (event === "close") {
      streamOn = false;
      return;
    }
    let d;
    try {
      d = JSON.parse(data);
    } catch (_) {
      return;
    }
    if (event === "state") {
      applyState(d);
      for (const e of evPre || []) evOffer(e);
      evPre = null;
    } else if (event === "work") applyWork(d);
    else if (event === "spectrum") window.dispatchEvent(new CustomEvent("phonebox-spectrum", { detail: d }));
    else if (event === "event") {
      if (evPre) {
        evPre.push(d);
        if (evPre.length > 100) evPre.shift();
      } else evOffer(d);
    }
  };
  var streaming = () => streamOn && Date.now() - lastStateAt < 3e3;
  function poll() {
    return __async(this, null, function* () {
      if (!streaming() || evReplay) {
        const replay = evReplay, gen = evGen;
        try {
          const s = yield api("/state" + (replay ? "?ev=0" : evSeq != null ? "?ev=" + evSeq : ""));
          if (applyState(s, replay ? gen : null) && replay && gen === evGen) {
            evReplay = s.evSeq != null && s.evSeq < evDrop;
            evDrop = 0;
            if (!evReplay) evDrain();
          }
        } catch (_) {
          if (!streaming()) setOnline(false);
        }
      }
      setTimeout(poll, 1e3);
    });
  }
  buildLayout();
  applyDisplay();
  tick();
  loadWeather();
  setInterval(loadWeather, 15 * 6e4);
  setInterval(() => {
    if (!nightOn) emit("fast");
  }, 250);
  setInterval(() => {
    if (online && anyNeeds("quotas")) loadQuotas();
  }, 3e4);
  setInterval(() => {
    if (online && anyNeeds("calendar")) loadCalendar();
  }, 12e4);
  setInterval(() => {
    if (online && anyNeeds("work") && !streaming()) loadWork();
  }, 3e3);
  setInterval(() => {
    if (online && pageOf("procs")) loadProcs();
    if (online && sheet) loadSheet();
  }, 2e3);
  setInterval(() => {
    if (online) loadConfig();
  }, 6e4);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && lastHour12 !== null && hour12() !== lastHour12) {
      buildLayout();
      renderRulesBtn();
      $("nClock").textContent = fmtHM(/* @__PURE__ */ new Date());
    }
  });
  poll();
  if (PREVIEW) {
    let weatherKey2 = "";
    window.addEventListener("message", (e) => {
      var _a;
      if (e.origin !== location.origin || ((_a = e.data) == null ? void 0 : _a.type) !== "phonebox-preview") return;
      const c = e.data.config || {};
      cfg = __spreadProps(__spreadValues(__spreadValues({}, DEFAULT_CFG), c), { night: __spreadProps(__spreadValues({}, c.night || {}), { enabled: false }), display: __spreadProps(__spreadValues({}, c.display || {}), { idleReturnSec: 0 }) });
      buildLayout();
      applyDisplay();
      const wk = JSON.stringify(cfg.weather);
      if (wk !== weatherKey2) {
        weatherKey2 = wk;
        loadWeather();
      }
      const list = cfg.pages || [], sel = list[e.data.page];
      const shown = (p) => p.enabled !== false && Array.isArray(p.widgets);
      const i = sel && shown(sel) ? list.slice(0, e.data.page).filter(shown).length : -1;
      if (i >= 0 && i !== curPage) goPage(i, true);
    });
    window.parent.postMessage({ type: "phonebox-preview-ready" }, location.origin);
  }
  function reportBattery() {
    if (PREVIEW || !(bridge == null ? void 0 : bridge.battery) || !online) return;
    try {
      const b = JSON.parse(bridge.battery());
      const usb = b.usb ? ["connected", "configured", "adb"].filter((k) => b.usb[k]).join(",") || "none" : "";
      if (b.level >= 0) api(`/phone/battery?level=${b.level}&plugged=${!!b.plugged}&temp=${b.temp || 0}&source=${b.source || ""}&usb=${usb}`, "POST", 4e3).catch(() => {
      });
    } catch (_) {
    }
  }
  setInterval(reportBattery, 3e4);
  setTimeout(reportBattery, 5e3);
  window.__pbUp = true;
  if (window.__pbClear) window.__pbClear("the panel did not finish booting");
})();
