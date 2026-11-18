#!/usr/bin/env bash
# Step 1 (one time): run on an Ubuntu "Try Ubuntu" live USB session.
# Pairs a Muse Home Link over Bluetooth, then saves the pairing next to this
# script (muse-state/state.tar) so Windows/WSL can use it. Nothing is printed
# that contains a token.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
TOKEN_FILE="$HERE/muse_sdk_token.txt"
[ -s "$TOKEN_FILE" ] || TOKEN_FILE="$HERE/../tv-assistant/muse_sdk_token.txt"
STATE=/var/lib/musegadget

[ -s "$TOKEN_FILE" ] || { echo "Can't find muse_sdk_token.txt (looked here and in ../tv-assistant)."; exit 1; }
touch "$HERE/.write-test" 2>/dev/null && rm -f "$HERE/.write-test" || {
  echo "This folder is read-only. In Windows, hold Shift and click Shut down (not Restart), then try again."; exit 1; }
[ -n "$(ls /sys/class/bluetooth 2>/dev/null)" ] || { echo "No Bluetooth found on this PC. Plug in a USB Bluetooth adapter and run again."; exit 1; }

sudo apt-get update -qq
sudo apt-get install -y -qq bluez curl git ca-certificates >/dev/null
sudo rfkill unblock bluetooth || true

# Seed the SDK token so the installer never needs it on the command line.
sudo mkdir -p -m 0700 "$STATE"
tr -d '\r\n ' < "$TOKEN_FILE" | sudo install -m 0600 /dev/stdin "$STATE/sdk_token"

curl -fsSL https://raw.githubusercontent.com/facebookincubator/muse-gadget-sdk/main/linux/install.sh -o /tmp/muse-install.sh
echo
echo "=== When it says pairing is open, on your phone's Muse app:"
echo "    Settings > Devices > Developer mode ON, then Add Device (+),"
echo "    pick MuseGadgetXXXXXX, accept the warning, pick the Wi-Fi shown. ==="
echo
bash /tmp/muse-install.sh --yes

sudo test -s "$STATE/pairing.json" || { echo "Not paired yet. Run: sudo /opt/musegadget/venv/bin/musegadget pair  (or rerun this script)"; exit 1; }

# Stop it here so only the WSL copy will be online.
sudo systemctl disable --now musegadget || true
mkdir -p "$HERE/muse-state"
sudo tar -C "$STATE" -cf - identity.json pairing.json sdk_token > "$HERE/muse-state/state.tar"
chmod 600 "$HERE/muse-state/state.tar"
echo
echo "DONE. Paired and saved to echo-muse/muse-state/state.tar."
echo "Shut down, remove the USB stick, boot Windows, and do step 2."
