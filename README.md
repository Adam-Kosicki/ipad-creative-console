# ipad-creative-console

Use an old iPad (or any old browser-only tablet) as a desk panel for your PC: a PC stats and media dashboard,
shortcut buttons, Claude Code / Codex usage limits, and Allow/Deny prompts for Claude sessions. It is
[PhoneBox](https://github.com/ersinkoc/phonebox)'s panel, rebuilt so it runs on **iOS 10 / Safari 10** (iPad 4th gen
and similar), served by a small LAN bridge.

<!-- photos: add a photo of the iPad running the panel here -->

PhoneBox is an Android app plus a Windows agent. This project reuses the agent and PhoneBox's panel UI, and adds:

- `bridge/server.js`: a zero-dependency Node server. It serves the panel to the iPad and proxies the iPad's requests to the
  PhoneBox agent on your PC. It forwards only the API paths PhoneBox itself allows over Wi-Fi.
- `scripts/build-panel.mjs`: turns PhoneBox's modern panel (ES modules, container queries, `clamp()`, `aspect-ratio`...)
  into something Safari 10 runs. Details below.
- `bridge/ipad-compat.js`, `bridge/ipad-pager.js`, `bridge/ipad.css`: polyfills, a GPU-friendly page swiper and
  performance tweaks for the iPad 4.

Credit: all panel features come from PhoneBox by ersinkoc (MIT). See [NOTICE](NOTICE).

## Quick start (Windows PC + iPad on the same Wi-Fi)
1. Install the PhoneBox agent (skip the Android parts):
   `irm https://raw.githubusercontent.com/ersinkoc/phonebox/main/setup.ps1 | iex`
   Open <http://127.0.0.1:8765> on the PC and design your pages. For Claude usage, sign in to Claude Code once
   (`claude`, then `/login`) and restart the PhoneBox agent.
2. Install Node.js 18+ and clone this repo.
3. Run `scripts/start-bridge.ps1` (PowerShell). It prints a link such as `http://<pc-ip>:8800/?t=...`.
   On a trusted home network `scripts/start-bridge.ps1 -Open` skips the token for private-network devices.
4. Allow port 8800 on the private network: `scripts/firewall.ps1` (as Administrator).
5. On the iPad open the link in Safari, then Share → Add to Home Screen for full screen.

The panel is prebuilt in `bridge/panel/`. To rebuild after a PhoneBox update:
`npm i --no-save esbuild@0.24.2` then `node scripts/build-panel.mjs <path to a phonebox clone>`.

Try it without a PC agent: `node bridge/mock-agent.js &` then `BRIDGE_TOKEN=tok node bridge/server.js` and open
<http://localhost:8800/panel/?t=tok>.

## What was needed for iOS 10 (and what you give up)
- JavaScript lowered to ES2016 (async/await becomes generators: Safari 10 crashes on async arrow functions).
- CSS: container units, `clamp()/min()/max()`, `aspect-ratio`, `place-items`, `color-mix()`, flex `gap`, `:is()` are
  lowered or computed at runtime by `ipad-compat.js`. `<button>` flex/grid layouts are wrapped, since Safari 10 lays buttons out as blocks.
- Polyfills for pointer events, `ResizeObserver`, `AbortController`, `Object.fromEntries` and more.
- Page swiping is JavaScript with `translate3d` (no scroll snapping on iOS 10). Pages are separate layers, the background
  glow is a plain background, and charts on off-screen pages are hidden. On an iPad 4 this measured about 32 to 57 fps while swiping.
- **Lite mode** (on by default on iOS 10 and older): pages don't follow your finger. A tab bar at the bottom names
  each page; a tap or a short flick switches instantly, nothing animates, and pages are not separate GPU layers.
  Open the panel with `?lite=0` to get the swiping pager back, or `?lite=1` to force lite on any device (remembered).
- Not available on iOS 10: microphone input (voice widgets), `backdrop-filter`, animations (disabled for speed), `@container` rules.
- Layout is tuned and tested on a 1024×768 iPad 4. Other devices should work but are untested.

## Security
Over plain HTTP on your LAN, the token (or, with `-Open`, being on your private network) is the only guard, and the
panel can approve or deny Claude actions and run your shortcuts. Use a network you trust. Settings, updates and pairing stay PC-only.

## Tools
`tools/` has frame-time and layout probes used to tune performance on a real iPad (run through any remote-eval debugging
setup). `bridge/bench/` has bare swipe benchmark pages (`/bench/?m=js|js-heavy|native`).

## Other docs
[docs/runbook-phonebox-panel.md](docs/runbook-phonebox-panel.md) (panel details), [docs/runbook-claude-bridge.md](docs/runbook-claude-bridge.md)
(the small ES5 approvals page at `/simple`), [docs/runbook-ipad.md](docs/runbook-ipad.md) (Macro Deck on the iPad).

## License
MIT, see [LICENSE](LICENSE). Panel files derived from PhoneBox are MIT, Copyright (c) 2026 Ersin KOÇ.
