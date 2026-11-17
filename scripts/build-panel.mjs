// Builds an iOS 10 copy of PhoneBox's own panel UI into bridge/panel/.
//
//   npm i --no-save esbuild@0.24.2
//   node scripts/build-panel.mjs <path to a phonebox clone>
//
// PhoneBox's panel (android/app/src/main/assets/www) is written for Chromium 80+: ES modules, ?. and ??,
// container query units (cqw...), clamp()/min()/max() and pointer events. Safari 10.1 (iOS 10.3.3) has none of
// these, so this script:
//   - bundles main.js and its modules into one classic script, lowered to Safari 10 syntax (esbuild);
//   - rewrites the CSS: cq units become calc(N * var(--cqw)), set at runtime by ipad-compat.js; clamp/min/max
//     keep one argument; gap also emits grid-gap;
//   - adds bridge/ipad-compat.js (polyfills) to index.html and drops the "WebView too old" guard.
// The PhoneBox source is not modified; its MIT licence is copied next to the output.
import { build, transform } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = process.argv[2];
if (!repo) { console.error('usage: node scripts/build-panel.mjs <phonebox clone>'); process.exit(1); }
const src = path.join(repo, 'android/app/src/main/assets/www');
const out = path.join(here, '..', 'bridge', 'panel');
// es2017, not 'safari10': esbuild refuses const for Safari 10 (an old loop-scoping bug), but the panel never hits it.
// es2017 still lowers ?., ??, object spread, regex flags and the rest that Safari 10.1 lacks.
const TARGET = 'es2017';

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

// 1. JavaScript: one bundle for the module graph, classic scripts transformed one by one.
await build({
  entryPoints: [path.join(src, 'main.js')], bundle: true, format: 'iife', target: TARGET,
  outfile: path.join(out, 'main.js'), legalComments: 'inline', logLevel: 'warning',
  // window.onAgentStream etc. are assigned in the modules; nothing needs to be exported from the bundle.
});
for (const f of fs.readdirSync(src)) {
  const p = path.join(src, f);
  if (f === 'main.js' || fs.statSync(p).isDirectory()) continue;
  if (f.endsWith('.js')) {
    const code = fs.readFileSync(p, 'utf8');
    // modules imported by main.js are inside the bundle already; only classic scripts are copied
    if (/^\s*(import|export)\s/m.test(code)) continue;
    fs.writeFileSync(path.join(out, f), (await transform(code, { target: TARGET, loader: 'js' })).code);
  } else if (f.endsWith('.css')) {
    const css = (await transform(fs.readFileSync(p, 'utf8'), { loader: 'css', target: TARGET })).code;
    fs.writeFileSync(path.join(out, f), rewriteCss(css));
  } else if (f !== 'index.html') {
    fs.cpSync(p, path.join(out, f), { recursive: true });
  }
}
// other assets the panel loads at runtime (images, fonts, widget html...), but not the widget modules
for (const d of fs.readdirSync(src)) {
  const p = path.join(src, d);
  if (!fs.statSync(p).isDirectory()) continue;
  fs.cpSync(p, path.join(out, d), { recursive: true, filter: (s) => !s.endsWith('.js') });
}

// Safari 10 throws "TypeError: Unable to delete property" for `delete el.dataset.x` in strict code (the modules
// are strict). Rewrite each one to a helper that removes the data-* attribute instead.
{
  const f = path.join(out, 'main.js');
  let js = fs.readFileSync(f, 'utf8'), n = 0;
  let res = '', i = 0;
  const re = /delete ([\w$]+(?:\.[\w$]+)*)\.dataset(\.([\w$]+)|\[)/g;
  let m;
  while ((m = re.exec(js))) {
    let key, end;
    if (m[3]) { key = JSON.stringify(m[3]); end = re.lastIndex; }
    else {
      let depth = 1, j = re.lastIndex;
      for (; j < js.length && depth; j++) { if (js[j] === '[') depth++; else if (js[j] === ']') depth--; }
      key = js.slice(re.lastIndex, j - 1); end = j;
    }
    res += js.slice(i, m.index) + `__pbDeleteData(${m[1]}, ${key})`;
    i = end; re.lastIndex = end; n++;
  }
  js = res + js.slice(i);
  fs.writeFileSync(f, js);
  console.log('dataset deletes rewritten:', n);
}

// 2. index.html
let html = fs.readFileSync(path.join(src, 'index.html'), 'utf8');
const guard = /var runs = 'noModule' in document\.createElement\('script'\);\s*try \{ new Function\([^\n]*\n/;
if (!guard.test(html)) throw new Error('index.html: WebView guard not found, PhoneBox changed; update build-panel.mjs');
html = html.replace(guard, 'var runs = true; return; // iPad build: syntax is lowered and cq units are polyfilled\n');
const mod = '<script type="module" src="main.js"></script>';
if (!html.includes(mod)) throw new Error('index.html: module script tag not found');
html = html.replace(mod, '<script src="main.js"></script>\n<script src="ipad-pager.js"></script>');
html = html.replace('<script src="compat.js"></script>', '<script src="ipad-compat.js"></script>\n<script src="compat.js"></script>');
// iOS: full screen when added to the Home Screen
// native-feel overrides last, so they win over PhoneBox's rules
html = html.replace('</head>', '<link rel="stylesheet" href="ipad.css">\n</head>');
html = html.replace('<title>', '<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-status-bar-style" content="black">\n<title>');
fs.writeFileSync(path.join(out, 'index.html'), html);

// 3. Polyfills, with the selectors of the CSS containers baked in.
const shim = fs.readFileSync(path.join(here, '..', 'bridge', 'ipad-compat.js'), 'utf8')
  .replace('/*CONTAINERS*/[]', JSON.stringify([...containers]))
  .replace('/*MATH*/[]', JSON.stringify(MATH.map((x) => [x.f, x.a])));
fs.writeFileSync(path.join(out, 'ipad-compat.js'), shim);
fs.copyFileSync(path.join(here, '..', 'bridge', 'ipad.css'), path.join(out, 'ipad.css'));
fs.copyFileSync(path.join(here, '..', 'bridge', 'ipad-pager.js'), path.join(out, 'ipad-pager.js'));
for (const f of ['LICENSE']) if (fs.existsSync(path.join(repo, f))) fs.copyFileSync(path.join(repo, f), path.join(out, 'PHONEBOX-LICENSE'));
console.log('built', out, '· containers:', [...containers].join(', '), '· computed clamp/min/max:', MATH.length);

// --- CSS rewriting ------------------------------------------------------------------------------------------------
var containers;
function rewriteCss(css) {
  containers ??= new Set();
  // selectors of rules that declare container-type: ipad-compat.js measures those elements
  for (const m of css.matchAll(/([^{}]+)\{[^{}]*container-type\s*:/g)) for (const s of m[1].split(',')) containers.add(s.trim());
  // blocks guarded by container-unit support: cq units are emulated, so keep their rules unconditionally
  css = css.replace(/@supports\s*\([^)]*\dcq[a-z]+\)\s*\{((?:[^{}]|\{[^{}]*\})*)\}/g, '$1');
  css = lowerMath(css);
  css = css.replace(/(-?\d*\.?\d+)cq(w|h|i|b|min|max)\b/g, (_, n, u) => {
    const v = { w: 'cqw', i: 'cqw', h: 'cqh', b: 'cqh', min: 'cqmin', max: 'cqmax' }[u];
    return `calc(${n} * var(--${v}, 1v${u === 'h' || u === 'b' ? 'h' : u === 'min' ? 'min' : u === 'max' ? 'max' : 'w'}))`;
  });
  // .a :is(b, c) {…}  ->  .a b, .a c {…}  (Safari 14+); one :is() per selector is all the panel uses
  css = css.replace(/([^{}]*:is\([^{}]*)\{/g, (_, sels) => sels.split(/,(?![^(]*\))/).flatMap((s) => {
    const m = /^(.*?):is\(([^()]*)\)(.*)$/s.exec(s.trim());
    return m ? m[2].split(',').map((x) => m[1] + x.trim() + m[3]) : [s.trim()];
  }).join(', ') + ' {');
  css = css.replace(/(^|[;{\s])(row-|column-)?gap\s*:([^;}]+)/g, (m, pre, kind, val) =>
    `${pre}grid-${kind || ''}gap:${val};${kind || ''}gap:${val}`);
  css += flexGapFallback(css);
  return css;
}

// clamp()/min()/max() (Safari 11.1+). When every argument is a plain length (px, cq*, vw...), the declaration becomes
// var(--pbmN, fallback) and ipad-compat.js computes --pbmN in px for every container from the MATH table.
// Otherwise (env(), %, var()) one argument is kept: clamp's middle one, else the fluid one, else the first without env().
var MATH; // (functions below run during the top-level build above, before later declarations would initialise)
function lowerMath(css) {
  MATH ??= [];
  const SIMPLE = /^(-?\d*\.?\d+)(px|cqw|cqh|cqi|cqb|cqmin|cqmax|vw|vh|vmin|vmax)?$/;
  // also calc(var(--x, d) * N unit): the factor is read from the container at runtime
  const SCALED = /^calc\(var\((--[\w-]+),\s*(-?\d*\.?\d+)\)\s*\*\s*(-?\d*\.?\d+)(px|cqw|cqh|cqi|cqb|cqmin|cqmax|vw|vh|vmin|vmax)\)$/;
  const re = /(^|[^\w-])(clamp|min|max)\(/g;
  let m;
  while ((m = re.exec(css))) {
    const start = m.index + m[1].length, open = start + m[2].length;
    let depth = 0, i = open, args = [], last = open + 1;
    for (; i < css.length; i++) {
      const c = css[i];
      if (c === '(') depth++;
      else if (c === ')') { if (--depth === 0) { args.push(css.slice(last, i)); break; } }
      else if (c === ',' && depth === 1) { args.push(css.slice(last, i)); last = i + 1; }
    }
    args = args.map((a) => a.trim());
    let pick;
    if (m[2] === 'clamp') pick = args[1];
    else pick = args.find((a) => /cq|v[wh]|%/.test(a) && !/env\(/.test(a)) || args.find((a) => !/env\(/.test(a)) || args[0];
    if (/[+\-*/]\s/.test(pick) && !/^calc\(/.test(pick)) pick = `calc(${pick})`;
    const parsed = args.map((a) => {
      const m1 = SIMPLE.exec(a); if (m1) return [+m1[1], m1[2] || 'px'];
      const m2 = SCALED.exec(a); if (m2) return [+m2[3], m2[4], m2[1], +m2[2]];
      return null;
    });
    if (parsed.every(Boolean)) {
      const key = m[2] + '(' + args.join(',') + ')';
      let n = MATH.findIndex((x) => x.key === key);
      if (n < 0) { n = MATH.length; MATH.push({ key, f: m[2], a: parsed }); }
      pick = `var(--pbm${n}, ${pick})`;
    }
    css = css.slice(0, start) + pick + css.slice(i + 1);
    re.lastIndex = start;
  }
  return css;
}

// Flexbox gap (Safari 14.1+): for plain rules that are flex containers with a gap, add margins between children,
// only when ipad-compat.js finds the browser lacks flex gap (it then sets html.no-flex-gap).
function flexGapFallback(css) {
  let out = '\n/* flex gap fallback */\n';
  for (const m of css.matchAll(/(?<=^|\})\s*([^{}@]+)\{([^{}]*)\}/g)) {
    const sel = m[1].trim(), body = m[2];
    if (!/display\s*:\s*(inline-)?flex\b/.test(body)) continue;
    const g = /(?:^|;|\s)gap\s*:\s*([^;]+)/.exec(body);
    if (!g) continue;
    const parts = [];   // split "row col" at top-level spaces only (values can be calc(...))
    let depth = 0, cur = '';
    for (const ch of g[1].trim()) {
      if (ch === '(') depth++; else if (ch === ')') depth--;
      if (/\s/.test(ch) && depth === 0) { if (cur) parts.push(cur); cur = ''; } else cur += ch;
    }
    if (cur) parts.push(cur);
    const column = /flex-direction\s*:\s*column/.test(body);
    const v = column ? parts[0] : (parts[1] || parts[0]);
    if (/^0(px)?$/.test(v)) continue;
    const prop = column ? 'margin-top' : 'margin-left';
    out += sel.split(/,(?![^(]*\))/).map((s) => `.no-flex-gap ${s.trim()} > * + *`).join(', ') + ` { ${prop}: ${v}; }\n`;
  }
  return out;
}
