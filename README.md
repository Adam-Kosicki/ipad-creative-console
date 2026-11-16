# phone-ipad-macro-deck

Turn old devices into desk panels: an iPad 4 (model A1458, iOS 10.3.3) first, a Galaxy S9 next.

| Piece | Role |
| --- | --- |
| [Macro Deck 3](https://github.com/Macro-Deck-App/Macro-Deck) (Apache-2.0) | Macro buttons. iPad opens its web client in Safari, nothing to install. |
| [PhoneBox](https://github.com/ersinkoc/phonebox) (MIT) | Claude allow/deny prompts and quotas. Android only. |
| `bridge/` (this repo) | Tiny ES5 web page + proxy that gives the iPad PhoneBox's Claude allow/deny and quotas. |

## Phases
1. **iPad macros**: [docs/runbook-ipad.md](docs/runbook-ipad.md)
2. **iPad Claude allow/deny + quotas**: [docs/runbook-claude-bridge.md](docs/runbook-claude-bridge.md)
3. **Galaxy S9**: [docs/s9-later.md](docs/s9-later.md)

## Status
Nothing here has run on real hardware yet: the PC is offline. The bridge was tested only against `bridge/mock-agent.js`.

```
node bridge/mock-agent.js &            # fake PhoneBox agent on :8765
BRIDGE_TOKEN=tok node bridge/server.js # open http://localhost:8800/?t=tok
```
