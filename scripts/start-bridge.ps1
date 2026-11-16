# Starts the iPad bridge. Needs Node.js. Optional: $env:BRIDGE_TOKEN = 'secret'
Set-Location (Join-Path $PSScriptRoot '..')
node bridge/server.js
