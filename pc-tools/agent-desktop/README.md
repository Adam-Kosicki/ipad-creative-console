# agent-desktop (Vercel Labs) for Muse

Lets an AI operate Windows apps through the UI Automation tree (no screenshots).
Repo: github.com/vercel-labs/agent-desktop (Apache-2.0). Installed with `npm install -g agent-desktop` (v1.3.1).

## Run
```powershell
powershell -ExecutionPolicy Bypass -File start-agent-desktop.ps1
```
Muse URL: `http://100.116.155.41:8001/mcp` (PC Tailscale IP, streamable HTTP).
Run once as Administrator so the script can add the firewall rule
"agent-desktop MCP (Muse only)" (port 8001, only from Muse's Tailscale IP 100.88.254.76).

## Notes
- Server listens on the Tailscale IP only. supergateway has no auth; the firewall rule is the guard.
- Ref actions are headless (cursor doesn't move). Notepad needs `set-value`, not `type`.
- Snapshots can include private desktop content (open Notepad tabs, tokens). Treat as sensitive.
