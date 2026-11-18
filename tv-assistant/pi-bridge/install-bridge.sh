#!/usr/bin/env bash
# Install the TV bridge on a Raspberry Pi that already runs Meta's Muse Linux gadget
# (install that first: https://github.com/facebookincubator/muse-gadget-sdk/tree/main/linux).
# Usage: bash install-bridge.sh <TV_IP>
set -euo pipefail
TV_IP="${1:-}"
HERE="$(cd "$(dirname "$0")" && pwd)"

[ -x /opt/musegadget/venv/bin/python ] || { echo "Install the Muse Linux gadget first (see README)."; exit 1; }
sudo apt-get install -y adb
sudo mkdir -p /opt/tvbridge
sudo cp "$HERE"/tvbridge.py "$HERE"/tv_store.py "$HERE"/tv_commands.py /opt/tvbridge/

# Run the bridge in place of the stock gadget service (it runs the same gadget inside it).
sudo mkdir -p /etc/systemd/system/musegadget.service.d
sudo tee /etc/systemd/system/musegadget.service.d/tvbridge.conf >/dev/null <<'CONF'
[Service]
Environment=PYTHONPATH=/opt/tvbridge
Environment=TVBRIDGE_STATE=/var/lib/tvbridge
ExecStart=
ExecStart=/opt/musegadget/venv/bin/python /opt/tvbridge/tvbridge.py run
CONF
sudo systemctl daemon-reload
if [ -n "$TV_IP" ]; then
  sudo PYTHONPATH=/opt/tvbridge TVBRIDGE_STATE=/var/lib/tvbridge /opt/musegadget/venv/bin/python /opt/tvbridge/tvbridge.py set-tv "$TV_IP"
  # adb runs as root inside the service; accept the prompt on the TV once.
  sudo adb connect "$TV_IP:5555" || true
fi
sudo systemctl restart musegadget
sleep 3
sudo PYTHONPATH=/opt/tvbridge TVBRIDGE_STATE=/var/lib/tvbridge /opt/musegadget/venv/bin/python /opt/tvbridge/tvbridge.py info
echo "Done. Put the token above into the TV app (see README)."
