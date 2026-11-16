# Claude allow/deny + quotas on the iPad (tested with real agent on Linux; not yet on an iPad)

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
- Verified by reading PhoneBox source (not by running it): the agent requires Host `127.0.0.1`/`localhost` (the bridge connects to that), and `BrowserGuard` only rejects requests carrying `Sec-Fetch-Site: cross-site|same-site` or a foreign `Origin` (Node sends neither). Quota JSON is `{providers:[{name,plan,limits:[{label,percent,...}]}]}`, which the page reads.
- **Tested end to end on Linux** against the real PhoneBox agent 0.9.12 (built with .NET 10): a simulated Claude Code `PermissionRequest` (POST `/api/hooks/claude/permission`) showed up in the bridge's `/api/approvals`, and `allow` through the bridge made the hook return `{"behavior":"allow"}`. Bridge and agent endpoints and headers all work.
- Still unverified: rendering on a real iPad 4 / iOS 10 Safari, and real quota data (needs a logged-in Claude Code on the PC).
- If nobody answers in time, Claude Code falls back to asking in the terminal.
