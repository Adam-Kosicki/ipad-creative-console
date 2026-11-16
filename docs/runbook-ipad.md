# iPad 4 + Macro Deck (UNTESTED)

iPad 4 maxes out at iOS 10.3.3. Macro Deck's native app needs iOS 15, so use the **web client** (rated "works with limitations" on iOS 9-14: some effects missing, dates/times as digits, slower).

## PC
- [ ] Install Macro Deck 3 (Windows, macOS Apple silicon, or Linux x64): https://github.com/Macro-Deck-App/Macro-Deck
- [ ] Give the PC a static IP or DHCP reservation.
- [ ] Run `scripts/firewall.ps1` as admin (Windows) or allow Macro Deck's port otherwise. Port is in Settings > Network.

## iPad
- [ ] Safari: open `http://<pc-ip>:<port>` (plain HTTP; HTTPS only adds PWA/wake lock, which iOS 10 lacks).
- [ ] Pair with the 6-digit code from the Wi-Fi icon in Macro Deck (one use, 15 min).
- [ ] Web client settings: **Rendering = Simple**, **Icon resolution = 128 or 256**.
- [ ] Settings > General > Auto-Lock = Never; keep it on the charger.
- [ ] Optional: Settings > General > Accessibility > Guided Access, then triple-click Home to pin Safari.
- [ ] Keep-awake over HTTP uses a silent looping video and needs one tap after each reload.

## Troubleshooting
- Can't connect: same Wi-Fi? firewall? correct port?
- Sluggish: Rendering = Simple, lower icon resolution, close other Safari tabs.

## What was tested in the cloud (Linux, no iPad)
- Built the Macro Deck host from source with .NET 10 and ran it; it listens on HTTP port **7193** by default (HTTPS 7194). Check Settings > Network on your PC in case yours differs.
- Built the web client (`ui/runtime` then `ui/web-client`, `npm run build`) and the repo's own `es-check es5` passed: the bundle is ES5, which is what iOS 10 Safari needs.
- Served the client from the host (`ASPNETCORE_WEBROOT=ui/web-client/dist`) and loaded it in Chromium with no JS errors. It showed "Finish the first-time setup in the Macro Deck desktop app, then reload": that first-time setup needs the desktop app on your PC.
- **Not tested:** real iPad 4 / iOS 10 Safari, pairing, and actual button performance.
