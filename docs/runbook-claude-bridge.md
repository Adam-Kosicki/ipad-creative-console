# Claude allow/deny + quotas on the iPad (UNTESTED on real hardware)

PhoneBox's own panel needs a modern browser and USB pairing, so it won't load on iOS 10. Instead `bridge/` proxies three calls of the PhoneBox agent (`127.0.0.1:8765`) to a plain ES5 page:
`GET /api/approvals`, `POST /api/approvals/{id}?decision=allow|deny|skip`, `GET /api/quotas`.
The bridge also polls `/api/state` every 2 s with `X-PhoneBox-App`: the agent only queues approvals while a "phone" was seen in the last 5 s.

## PC steps
- [ ] Install and run the PhoneBox agent (`setup.ps1` / `setup.sh` in the PhoneBox repo).
- [ ] In PhoneBox settings: enable **Claude Code permission prompts** and press **Install hook**.
- [ ] Install Node.js, then run `scripts/start-bridge.ps1` (or `BRIDGE_TOKEN=... node bridge/server.js`). It prints the iPad URL with a token.
- [ ] Allow the bridge port (default 8800) in the firewall: `scripts/firewall.ps1`.

## iPad
- [ ] Open the printed URL in a second Safari tab (or add to Home Screen).

## Notes / risks
- Access is guarded only by the token in the URL, over plain HTTP on your LAN. Anyone on the network with the URL can approve Claude actions. Keep the token secret; use a trusted network.
- Not yet verified: agent behaviour with a non-browser client against `BrowserGuard`, and the exact quota JSON on a live agent.
- If nobody answers in time, Claude Code falls back to asking in the terminal.
