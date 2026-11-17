# TV Assistant: talk to Muse through the TV

Say **"Hey Jarvis"** to the Sony TV, ask for something ("set an alarm for 1 hour"), and Muse
does it and answers out loud.

Two ways to run it:

- **No Pi (default):** the TV app *is* the Muse device. It embeds Meta's Muse gadget SDK
  (Python, via Chaquopy) and pairs over the TV's own Bluetooth. Muse can then call `tv.*`
  commands right on the TV: timers/alarms, `tv.say`, volume, media keys, open apps, YouTube.
- **With a Pi (optional):** the Pi is the Muse device and the TV app is a thin mic/speaker.

### No-Pi setup

```sh
adb connect <TV_IP>:5555
adb install -r tv-assistant.apk
adb shell pm grant com.adamk.tvassistant android.permission.RECORD_AUDIO
adb shell appops set com.adamk.tvassistant SYSTEM_ALERT_WINDOW allow
adb shell am start -n com.adamk.tvassistant/.MainActivity --es sdk_token <mgst_ token from gadgets.muse.ai>
```

Then press **Pair with Muse** on the TV, and in the Muse app (Developer mode on) go to
Settings > Devices > Add Device and pick the `MuseGadgetXXXXXX` the TV shows.

### Pi option

```
TV app (Android TV)                     Raspberry Pi                         Muse (Meta)
"Hey Jarvis" detector (openWakeWord) →  tvbridge.py runs the official   →   answers, runs tv.* commands
records the request, plays the reply ←  Muse Linux gadget + LAN API      ←  on the Pi gadget
alarm screen, speech pushed by the Pi   timers/alarms, adb to the TV
```

- `android/`: the TV app. GitHub Actions builds it and publishes `tv-assistant.apk` to the
  `tv-assistant-latest` pre-release.
- `pi-bridge/`: the Pi side. It runs Meta's gadget service in-process, adds a small HTTP API on
  port 8790 for the TV, and gives Muse `tv.set_timer`, `tv.set_alarm`, `tv.list_timers`,
  `tv.cancel_timer`, `tv.say`, `tv.key` and `tv.open_app`.

### Set up the Pi

1. Raspberry Pi OS (64-bit Lite is fine), on the same network as the TV.
2. Install Meta's Muse Linux gadget and pair it from the Muse app (Settings > Devices >
   Developer mode, then Add Device). It needs your SDK token from gadgets.muse.ai:
   ```sh
   curl -fsSL https://raw.githubusercontent.com/facebookincubator/muse-gadget-sdk/main/linux/install.sh -o install.sh
   bash install.sh --sdk-token mgst_...
   ```
3. Copy `pi-bridge/` to the Pi and run `bash install-bridge.sh <TV_IP>`. Accept the
   "Allow USB debugging" prompt on the TV. Note the token it prints.

### Set up the TV (Pi option)

```sh
adb connect <TV_IP>:5555
adb install -r tv-assistant.apk
adb shell pm grant com.adamk.tvassistant android.permission.RECORD_AUDIO
adb shell appops set com.adamk.tvassistant SYSTEM_ALERT_WINDOW allow
adb shell am start -n com.adamk.tvassistant/.MainActivity --es bridge http://<PI_IP>:8790 --es token <TOKEN>
```

The app's screen shows the mic level and the live "Hey Jarvis" score, which helps check the
TV's mic. `--ef threshold 0.4` makes the wake word easier to trigger (default 0.5).

## Test without a Pi

`python3 pi-bridge/tvbridge.py fake` runs a stand-in bridge on any computer (port 8790). It
echoes what it got and the TV answers in its own voice. Point the app's `bridge` at that computer.

## Tests

```sh
pip install websockets cryptography pytest
pip install -e <muse-gadget-sdk>/linux
cd pi-bridge && python -m pytest -q tests
```

The wake-word models come from openWakeWord releases at build time (pre-trained models are
CC BY-NC-SA 4.0: personal use only).
