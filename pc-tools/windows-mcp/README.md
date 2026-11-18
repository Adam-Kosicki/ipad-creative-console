# Muse controls your PC (Windows-MCP)

Uses https://github.com/CursorTouch/Windows-MCP. Only Muse's Tailscale address
can reach it. PowerShell, Registry and FileSystem tools are off.

## Setup (about 5 min)
1. Make sure Muse is on your Tailscale: in the Muse app ask
   "Connect to my Tailscale" and approve the link (skip if already done).
2. Open PowerShell **as Administrator** (first time only) and run:
   `powershell -ExecutionPolicy Bypass -File C:\Users\maste\Desktop\PC-Workspace\windows-mcp\start-windows-mcp.ps1`
3. Leave that window open. It prints the address, like http://100.x.x.x:8000/mcp

## Try it
Send Muse (put in the address it printed):
> My PC runs a Windows-MCP server (MCP over streamable HTTP) at
> http://100.x.x.x:8000/mcp on my Tailscale. Remember it. Use it to open
> Chrome on my PC.

Then try: "open the MrBeast YouTube channel on my PC", "message Sam on Discord: hi".

## Turn PowerShell on later
Edit the script: change `$Exclude = "PowerShell,Registry,FileSystem"` to
`$Exclude = "Registry,FileSystem"`.
