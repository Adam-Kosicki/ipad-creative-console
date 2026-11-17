# Starts the iPad debug proxy next to the bridge (run start-bridge.ps1 first, in another window).
# On the iPad open http://<pc-ip>:8801 instead of :8800. Debug console: the second link it prints.
Set-Location (Join-Path $PSScriptRoot '..')
node bridge/debug-proxy.js
