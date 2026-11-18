# Project log (Jarvis) — saved 2026-11-18

## Done
**iPad 4 (iOS 10.3.3) macro deck**
- PhoneBox panel bridge (PR #1), lite mode, remote view of the iPad, swipe perf 6-18 -> 32-57 fps.
- 3D-printed iPad stand found.
- Repo renamed ipad-creative-console; upstream issue drafted for ersinkoc/phonebox.

**Sony TV "Jarvis" voice assistant (talks to Muse)**
- Plays all replies, on-screen transcript, Google recognizer, mic fix.
- Muse SDK device guide used instead of a prompt prefix; PC line added to the guide.

**Tailscale**
- TV joined. ACL: Muse -> TV:5555 (ADB) and Muse -> adas:8001 only.
- Tailscale DNS is off on the TV (AdGuard clash).
- IPs: PC adas 100.116.155.41, TV 100.102.226.107, Muse 100.88.254.76.

**Claude <-> Muse**
- `muse-cli` works on the PC (`C:\Users\maste\.local\bin\muse-cli.exe`).
- Login is one line `hatch_sess=<value>` in `~\.config\muse-cli\cookies.txt`. Refresh from browser F12 when expired. Never commit it.
- Claude cloud can't reach Tailscale; the PC (Remote Control) is the bridge.

**PC desktop control**
- agent-desktop + supergateway on :8001, Muse connector `custom.agent-desktop`, Desktop shortcut "Start agent-desktop" (admin).
- `--headed` added to the script; not restarted or tested yet.
- Windows-MCP set up but unused (agent-desktop chosen).

## Remaining to do
- Muse slowness (~15s/turn is Muse itself): saved one-step routines / desktop_batch, ADB shortcuts, single-window snapshots, ask Muse about a faster model.
- Restart agent-desktop to test headed mode; test casting.
- Echo Dot / Google TV Home Link: needs Ubuntu USB pairing (`pc-tools/echo-muse`).
- Better agent-to-agent (A2A) later. No Agent Mail.
- Always-on Mac server / Mac node later.
- Check iPad models.
- Real-finger swipe benchmark on iPad (bench via :8801 debug proxy) when charged.
- TV playback: Muse should play videos directly, using ADB launch with the video ID, never asking Adam to tap. A saved rule is being taught to Muse; verify it works.
- Research options (nothing built): TV as extra monitor (Apollo + Moonlight), Muse coding on PC (enable Windows-MCP PowerShell), Tailscale app on TV for direct Muse access.

## Notes
- Reuse existing integrations; ask before building new features.
- Start a new thread when context gets high or for a new task.
