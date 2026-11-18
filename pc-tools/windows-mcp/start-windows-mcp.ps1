# Starts Windows-MCP so only Muse (over Tailscale) can control this PC.
# PowerShell, Registry and FileSystem tools are OFF. To turn PowerShell on,
# remove "PowerShell," from $Exclude below.
$ErrorActionPreference = "Stop"
$Port    = 8000
$Exclude = "PowerShell,Registry,FileSystem"

# 1. Tailscale addresses
$ts = "C:\Program Files\Tailscale\tailscale.exe"
if (-not (Test-Path $ts)) { throw "Tailscale isn't installed on this PC. Install it from tailscale.com, then rerun." }
$PcIp = (& $ts ip -4).Trim()
$museLine = & $ts status | Where-Object { $_ -match '\smuse(\s|-)' } | Select-Object -First 1
if (-not $museLine) { throw "Muse isn't on your Tailscale yet. In the Muse app, ask: 'Connect to my Tailscale', approve the link, then rerun." }
$MuseIp = ($museLine -split '\s+')[0]
Write-Host "PC Tailscale IP:   $PcIp"
Write-Host "Muse Tailscale IP: $MuseIp"

# 2. uv (official installer), only if missing
if (-not (Get-Command uvx -ErrorAction SilentlyContinue)) {
  Write-Host "Installing uv..."
  powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
  $env:Path = "$env:USERPROFILE\.local\bin;$env:Path"
}

# 3. Firewall: allow the port only from Muse's address (needs admin once)
$rule = "Windows-MCP (Muse only)"
if (-not (Get-NetFirewallRule -DisplayName $rule -ErrorAction SilentlyContinue)) {
  try {
    New-NetFirewallRule -DisplayName $rule -Direction Inbound -Protocol TCP -LocalPort $Port -RemoteAddress $MuseIp -Action Allow | Out-Null
    Write-Host "Firewall rule added."
  } catch {
    Write-Host "Couldn't add the firewall rule. Run this window as Administrator once, then rerun." -ForegroundColor Yellow
    exit 1
  }
}

# 4. Run it. Listens only on the Tailscale address and only accepts Muse.
Write-Host "Windows-MCP running at http://${PcIp}:$Port/mcp  (Ctrl+C to stop)" -ForegroundColor Green
uvx --python 3.13 windows-mcp serve --transport streamable-http --host $PcIp --port $Port --ip-allowlist $MuseIp --exclude-tools $Exclude
