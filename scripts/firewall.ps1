# Run as Administrator. Pass the Macro Deck port: .\firewall.ps1 -MacroDeckPort 8080
param([int]$MacroDeckPort = 0, [int]$BridgePort = 8800)
New-NetFirewallRule -DisplayName 'iPad bridge' -Direction Inbound -Protocol TCP -LocalPort $BridgePort -Action Allow -Profile Private
if ($MacroDeckPort) { New-NetFirewallRule -DisplayName 'Macro Deck web client' -Direction Inbound -Protocol TCP -LocalPort $MacroDeckPort -Action Allow -Profile Private }
