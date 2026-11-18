#!/usr/bin/env bash
# Step 2: run inside Ubuntu on WSL (Windows). Turns WSL into the Muse Home Link
# and installs the Echo control script. Safe to rerun.
set -euo pipefail
WS=/mnt/c/Users/maste/Desktop/PC-Workspace/echo-muse
STATE_TAR="${1:-$WS/muse-state/state.tar}"
ICLOUD=/mnt/c/Users/maste/iCloudDrive/echo-muse/muse-state/state.tar
[ -f "$STATE_TAR" ] || [ ! -f "$ICLOUD" ] || STATE_TAR="$ICLOUD"
HL=musehome                       # account Muse's commands run as (no sudo)
STATE=/var/lib/musegadget
ARC_COMMIT=fdea2bc0               # alexa-remote-control commit the skill was tested with

# --- 0. systemd must be on in WSL ---------------------------------------
if [ ! -d /run/systemd/system ]; then
  printf '[boot]\nsystemd=true\n' | sudo tee /etc/wsl.conf >/dev/null
  echo "Turned on systemd. In PowerShell run:  wsl --shutdown"
  echo "Then open Ubuntu again and rerun this script."
  exit 0
fi

sudo apt-get update -qq
sudo apt-get install -y -qq curl jq util-linux git ca-certificates python3 >/dev/null

# --- 1. dedicated account with no sudo ----------------------------------
id "$HL" >/dev/null 2>&1 || sudo useradd -m -s /bin/bash "$HL"

# --- 2. Muse Home Link (pairing copied from step 1) ---------------------
if ! sudo test -s "$STATE/pairing.json"; then
  [ -f "$STATE_TAR" ] || { echo "Can't find $STATE_TAR (run pair-on-mac.sh on the Mac first)."; exit 1; }
  sudo mkdir -p -m 0700 "$STATE"
  sudo tar -C "$STATE" -xf "$STATE_TAR"
  sudo chmod 600 "$STATE"/*
fi
curl -fsSL https://raw.githubusercontent.com/facebookincubator/muse-gadget-sdk/main/linux/install.sh -o /tmp/muse-install.sh
bash /tmp/muse-install.sh --run-as "$HL" --no-pair --yes

# --- 3. Alexa control script + login tool -------------------------------
sudo curl -fsSL "https://raw.githubusercontent.com/thorsten-gehrig/alexa-remote-control/$ARC_COMMIT/alexa_remote_control.sh" \
  -o /usr/local/bin/alexa-remote-control.sh
sudo chmod 755 /usr/local/bin/alexa-remote-control.sh
if [ ! -x /usr/local/bin/alexa-cookie-cli ]; then
  url="$(curl -fsSL https://api.github.com/repos/adn77/alexa-cookie-cli/releases/latest \
        | jq -r '.assets[].browser_download_url' | grep -i linux | grep -iv arm | head -1)"
  [ -n "$url" ] || { echo "Couldn't find the alexa-cookie-cli Linux download."; exit 1; }
  sudo curl -fsSL "$url" -o /usr/local/bin/alexa-cookie-cli
  sudo chmod 755 /usr/local/bin/alexa-cookie-cli
fi

# --- 4. private settings file (US Amazon) -------------------------------
HOME_HL="$(getent passwd "$HL" | cut -d: -f6)"
ENV="$HOME_HL/.config/alexa-remote-control.env"
sudo -u "$HL" mkdir -p -m 0700 "$HOME_HL/.config" "$HOME_HL/.alexa"
if ! sudo -u "$HL" grep -q '^export REFRESH_TOKEN=.\+' "$ENV" 2>/dev/null; then
  echo
  echo "=== Amazon sign-in: open http://127.0.0.1:8080 in your Windows browser"
  echo "    and log in to Amazon. This window continues by itself after. ==="
  TOKEN="$(alexa-cookie-cli -q -p amazon.com -a en_US -L en-US | grep -o 'Atnr|[^\" ]*' | tail -1)"
  [ -n "$TOKEN" ] || { echo "Sign-in didn't finish. Rerun this script."; exit 1; }
  sudo -u "$HL" sh -c 'umask 077; cat > "$1"' _ "$ENV" <<ENVEOF
export AMAZON=amazon.com
export ALEXA=alexa.amazon.com
export TTS_LOCALE=en-US
export TMP=$HOME_HL/.alexa
export REFRESH_TOKEN='$TOKEN'
ENVEOF
  unset TOKEN
fi

# --- 5. quick test: list Echo devices -----------------------------------
echo; echo "Your Alexa devices:"
sudo -u "$HL" bash -c '. ~/.config/alexa-remote-control.env && rm -f "$TMP"/.alexa.devicelist.* && alexa-remote-control.sh -a' || true

# --- 6. lock down: Muse can't see C: drive or start Windows programs ----
if ! grep -q '^\[automount\]' /etc/wsl.conf; then
  printf '\n[automount]\nenabled=false\n\n[interop]\nenabled=false\nappendWindowsPath=false\n' | sudo tee -a /etc/wsl.conf >/dev/null
  echo
  echo "Locked down. In PowerShell run:  wsl --shutdown   then open Ubuntu once more."
fi
echo
echo "DONE. Keep an Ubuntu window open while testing; Muse can now reach your Echo."
