# Starts agent-desktop (MCP over stdio) behind supergateway so only Muse (over Tailscale) can reach it.
# Same pattern as windows-mcp\start-windows-mcp.ps1. Needs: npm i -g agent-desktop
$ErrorActionPreference = "Stop"
$Port = 8001
$ts = "C:\Program Files\Tailscale\tailscale.exe"
if (-not (Test-Path $ts)) { throw "Tailscale isn't installed." }
$PcIp = (& $ts ip -4).Trim()
$museLine = & $ts status | Where-Object { $_ -match '\smuse(\s|-)' } | Select-Object -First 1
if (-not $museLine) { throw "Muse isn't on your Tailscale yet." }
$MuseIp = ($museLine -split '\s+')[0]
Write-Host "PC Tailscale IP:   $PcIp"
Write-Host "Muse Tailscale IP: $MuseIp"

$rule = "agent-desktop MCP (Muse only)"
if (-not (Get-NetFirewallRule -DisplayName $rule -ErrorAction SilentlyContinue)) {
  try {
    New-NetFirewallRule -DisplayName $rule -Direction Inbound -Protocol TCP -LocalPort $Port -RemoteAddress $MuseIp -Action Allow | Out-Null
    Write-Host "Firewall rule added."
  } catch {
    Write-Host "Couldn't add the firewall rule. Run as Administrator once, then rerun." -ForegroundColor Yellow
    exit 1
  }
}
Write-Host "agent-desktop MCP at http://${PcIp}:$Port/mcp  (Ctrl+C to stop)" -ForegroundColor Green
npx -y supergateway --stdio "agent-desktop mcp --headed" --outputTransport streamableHttp --host $PcIp --port $Port
