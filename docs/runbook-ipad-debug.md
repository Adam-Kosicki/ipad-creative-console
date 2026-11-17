# Debug the iPad remotely

So errors on the iPad can be read and fixed from the PC (or by Claude) without photos of the screen.

## Start
1. Bridge as usual: `scripts\start-bridge.ps1`
2. In a second window: `scripts\start-debug.ps1` (runs `node bridge/debug-proxy.js`, port 8801)
3. Once, as Administrator: `New-NetFirewallRule -DisplayName 'iPad debug proxy' -Direction Inbound -Protocol TCP -LocalPort 8801 -Action Allow -Profile Private`
4. On the iPad open `http://<pc-ip>:8801` (same panel, with the debug client added).

## What you get
- Every console message and JS error from the iPad, live in the proxy window and in `bridge/.debug/log.jsonl`.
- Debug console in a PC browser: `http://localhost:8801/__dbg/?k=<key>` (key in `bridge/.debug-key`). Run JS on the iPad, reload it, list what is on screen.
- HTTP API (same key, `?k=` or header `X-Debug-Key`):

| Call | Does |
| --- | --- |
| `GET /__dbg/logs?since=N` | log entries after N |
| `GET /__dbg/clients` | connected iPads |
| `POST /__dbg/eval` (body = JS) | runs it on the iPad, returns the result (promises are awaited) |
| `POST /__dbg/reload` | reloads the iPad page |
| `GET /__dbg/outline` | visible elements with their position and text |
| `GET /__dbg/snapshot` | full DOM + viewport (also saved to `bridge/.debug/snapshot.json`) |
| `GET /__dbg/screenshot` | real screenshot over USB (PNG), see below |

On the iPad page, `__dbg.tap('#selector')`, `__dbg.tap(x, y)` and `__dbg.swipe(x1, y1, x2, y2)` press things without a finger.

## Screenshots over USB
Needs the iPad on USB, trusted, Apple Mobile Device Support (iTunes) and `pymobiledevice3`.
Default command: `pymobiledevice3 developer dvt screenshot "{out}"`. Override with `DEBUG_SCREENSHOT_CMD` (use `{out}` for the file path).

## Safety
The proxy answers home-network addresses only. iPad-side calls need no key (like the panel itself); control calls need the key, because eval can press Allow on Claude prompts.
