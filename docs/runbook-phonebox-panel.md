# PhoneBox's full panel on the iPad (iOS 10)

The bridge now also serves PhoneBox's own panel (clock, PC stats, media, Claude/Codex quotas, sessions,
allow/deny, shortcuts) at `/panel/`, rebuilt so Safari 10 can run it.

## PC steps (Windows)
1. Install and start the PhoneBox agent: in PowerShell, `irm https://raw.githubusercontent.com/ersinkoc/phonebox/main/setup.ps1 | iex`.
   Skip the Android parts. Design your pages at <http://127.0.0.1:8765> (pick a 4:3 landscape-friendly layout).
2. Install Node.js 18+ and clone this repo.
3. Run `scripts/start-bridge.ps1`. It prints the iPad link, e.g. `http://<pc-ip>:8800/?t=...`.
   The token is saved in `bridge/.token`, so the link keeps working after restarts.
   On a trusted home network, `scripts/start-bridge.ps1 -Open` skips the token for local devices, so the link is
   just `http://<pc-ip>:8800` (anyone on that Wi-Fi can then use the panel, including Claude allow/deny).
4. Allow port 8800 on the private network: `scripts/firewall.ps1` (as Administrator).

## iPad
1. Open the printed link in Safari (use the PC's LAN IP, same Wi-Fi).
2. Share → **Add to Home Screen** for full screen.
3. Swipe left/right to change pages.

## What the build changes (`scripts/build-panel.mjs`)
PhoneBox's panel targets Chromium 80+. The build:
- bundles its ES modules into one script and lowers syntax to ES2017 (`?.`, `??`, spread...);
- replaces container units (`5cqh`) with CSS variables, and `clamp()/min()/max()` with variables computed
  per widget, both filled in by `bridge/ipad-compat.js`;
- adds polyfills (pointer events from touches, ResizeObserver, AbortController, Object.fromEntries...);
- removes the panel's "WebView too old" guard.

To rebuild after a PhoneBox update: `npm i --no-save esbuild@0.24.2`, then
`node scripts/build-panel.mjs <path to a phonebox clone>`.

## Tested
- Through the bridge against PhoneBox's own demo data, in Chromium at iPad size (1024×768) with the modern APIs
  removed so the polyfills run: the panel boots with no errors, all 30 demo pages build (110 widgets), quotas show,
  touch swipes change pages.
- **Not yet on a real iPad 4.** Expect rough edges: Safari 10 has no flexbox `gap` (tighter spacing), no
  `aspect-ratio`, no `@container` rules (some widgets keep details they would hide when small), and the A6 chip
  may be slow on busy pages. Keep pages light.

## Security
Same as the simple page: the token is the only guard, over plain HTTP on your LAN. The bridge forwards only the
API paths the agent itself allows over Wi-Fi (plus read-only `/api/push` and `/api/proxy`), so settings,
updates and pairing stay PC-only.
