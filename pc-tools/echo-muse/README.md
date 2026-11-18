# Echo Dot + Muse (test on your Windows PC)

Muse controls the Echo through a small Linux "Home Link". For the test, that
Linux is Ubuntu inside Windows (WSL). It only works while the PC is on.

The catch: Muse pairs a Home Link over **Bluetooth**, and neither Windows nor
WSL can do that. So you pair **once** from an Ubuntu USB stick, then never again.

## You need
- PC Bluetooth (or a ~$10 USB Bluetooth adapter)
- A USB stick, 8 GB+ (gets erased)
- Muse app on your phone

## Step 1: pair once (about 20 min)
1. Make an Ubuntu stick: download Ubuntu 24.04 Desktop and write it with Rufus.
2. In Windows, hold **Shift** and click **Shut down** (so Ubuntu can write to C:).
3. Boot from the stick, choose **Try Ubuntu**, connect Wi-Fi.
4. In Files, open your Windows disk, go to
   `Users/maste/Desktop/PC-Workspace/echo-muse`, right click > Open in Terminal, run:
   `bash 1-pair-live-usb.sh`
5. When it says pairing is open, add the device in the Muse app
   (Settings > Devices > Developer mode on > Add Device).
6. When it says DONE, shut down, remove the stick, boot Windows.

## Step 2: set up WSL (about 10 min)
1. PowerShell (admin): `wsl --install -d Ubuntu`, restart if asked, make a user.
2. In Ubuntu: `bash /mnt/c/Users/maste/Desktop/PC-Workspace/echo-muse/2-setup-wsl.sh`
3. When asked, open http://127.0.0.1:8080 in your browser and log in to Amazon.
4. Follow any "run wsl --shutdown" line it prints, then rerun until it says DONE.

## Step 3: try it
In the Muse app, send:
> Use this skill: https://github.com/facebookincubator/muse-gadget-sdk/tree/main/skills/gadget-amazon-echo
> The env file is ~/.config/alexa-remote-control.env. Say "hello from Muse" on my Echo Dot.

Keep an Ubuntu window open while testing. After step 2 says DONE you can
delete `echo-muse\muse-state` (WSL has its own copy).

## Notes
- Muse runs commands as a separate `musehome` account with no admin rights,
  and the setup hides your C: drive from Linux.
- Your Amazon password is never stored; only a sign-in token, in a private file.
- Later, the same pairing files can move to a Pi if you get one.
