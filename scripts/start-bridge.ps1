# Starts the iPad bridge. Needs Node.js. Optional: $env:BRIDGE_TOKEN = 'secret'
# -Open: no token for devices on your home network, so the iPad link is just http://<pc-ip>:8800
param([switch]$Open)
Set-Location (Join-Path $PSScriptRoot '..')
if ($Open) { $env:BRIDGE_OPEN_LAN = '1' }
node bridge/server.js
