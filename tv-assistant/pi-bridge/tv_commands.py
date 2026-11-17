"""Gadget commands Muse can call on the TV: timers, alarms, speech, keys and apps.

Timers ring on the TV through the bridge's event feed. Keys and apps use adb over
the network (the TV must have ADB debugging on and have accepted this Pi once).
"""

from __future__ import annotations

import re
import shutil
import subprocess
import time
from datetime import datetime, timedelta

from musegadget.executor import Executor

TV_COMMAND_SPECS = {
    "tv.set_timer": {
        "description": "Start a countdown timer that rings and speaks on the living-room TV.",
        "required": {"seconds": {"type": "integer", "description": "Length in seconds (1 to 86400)."}},
        "optional": {"label": {"type": "string", "description": "What it's for, spoken when it rings."}},
    },
    "tv.set_alarm": {
        "description": ("Set an alarm that rings on the TV at a clock time (the Pi's local time zone). "
                        "If that time already passed today it rings tomorrow."),
        "required": {"time": {"type": "string", "description": "24-hour local time HH:MM, or an ISO date-time."}},
        "optional": {"label": {"type": "string", "description": "Spoken when it rings."}},
    },
    "tv.list_timers": {"description": "List timers and alarms waiting to ring, with ids and seconds left."},
    "tv.cancel_timer": {
        "description": "Cancel a timer or alarm by id (from tv.list_timers), or all with id 'all'.",
        "required": {"id": {"type": "string", "description": "Timer id, or 'all'."}},
    },
    "tv.say": {
        "description": "Make the TV say something out loud right now, in the TV's own voice.",
        "required": {"text": {"type": "string", "description": "What to say (keep it short)."}},
    },
    "tv.key": {
        "description": ("Press a TV remote key: home, back, up, down, left, right, ok, volume_up, volume_down, "
                        "mute, play_pause, next, previous, power_on, power_off."),
        "required": {"key": {"type": "string", "description": "Key name from the list."}},
        "optional": {"times": {"type": "integer", "description": "Repeat count, 1 to 20. Default 1."}},
    },
    "tv.open_app": {
        "description": "Open an app on the TV, e.g. youtube, netflix, spotify, plex, prime video, or a package name.",
        "required": {"app": {"type": "string", "description": "App name or Android package name."}},
    },
}

KEYCODES = {
    "home": "KEYCODE_HOME", "back": "KEYCODE_BACK", "up": "KEYCODE_DPAD_UP", "down": "KEYCODE_DPAD_DOWN",
    "left": "KEYCODE_DPAD_LEFT", "right": "KEYCODE_DPAD_RIGHT", "ok": "KEYCODE_DPAD_CENTER",
    "volume_up": "KEYCODE_VOLUME_UP", "volume_down": "KEYCODE_VOLUME_DOWN", "mute": "KEYCODE_VOLUME_MUTE",
    "play_pause": "KEYCODE_MEDIA_PLAY_PAUSE", "next": "KEYCODE_MEDIA_NEXT", "previous": "KEYCODE_MEDIA_PREVIOUS",
    "power_on": "KEYCODE_WAKEUP", "power_off": "KEYCODE_SLEEP",
}

APPS = {
    "youtube": "com.google.android.youtube.tv", "netflix": "com.netflix.ninja",
    "spotify": "com.spotify.tv.android", "plex": "com.plexapp.android",
    "prime video": "com.amazon.amazonvideo.livingroom", "disney+": "com.disney.disneyplus",
    "disney plus": "com.disney.disneyplus", "hulu": "com.hulu.livingroomplus", "twitch": "tv.twitch.android.app",
    "max": "com.wbd.stream", "stremio": "com.stremio.one", "settings": "com.android.tv.settings",
    "tv assistant": "com.adamk.tvassistant",
}

_PACKAGE_RE = re.compile(r"^[A-Za-z][\w]*(\.[A-Za-z][\w]*)+$")


def parse_alarm_time(value: str, now: datetime | None = None) -> datetime:
    now = now or datetime.now()
    value = value.strip()
    match = re.fullmatch(r"(\d{1,2}):(\d{2})", value)
    if match:
        hour, minute = int(match.group(1)), int(match.group(2))
        if hour > 23 or minute > 59:
            raise ValueError("time must be HH:MM in 24-hour time")
        when = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
        return when if when > now else when + timedelta(days=1)
    when = datetime.fromisoformat(value)
    if when.tzinfo is not None:
        when = when.astimezone().replace(tzinfo=None)
    if when <= now:
        raise ValueError("that time has already passed")
    return when


def adb(tv_host: str, *args: str, timeout: int = 15) -> subprocess.CompletedProcess:
    if not tv_host:
        raise RuntimeError("the TV's address isn't set; run `tvbridge.py set-tv <ip>` on the Pi")
    if not shutil.which("adb"):
        raise RuntimeError("adb is not installed on the Pi (sudo apt install adb)")
    target = tv_host if ":" in tv_host else f"{tv_host}:5555"
    subprocess.run(["adb", "connect", target], capture_output=True, timeout=timeout)
    return subprocess.run(["adb", "-s", target, *args], capture_output=True, text=True, timeout=timeout)


def wake_tv(tv_host: str) -> None:
    """Best effort: turn the screen on so an alarm is seen and heard."""
    try:
        adb(tv_host, "shell", "input", "keyevent", "KEYCODE_WAKEUP")
    except Exception:
        pass


def _ok(payload: dict) -> dict:
    return {"ok": True, "payload": payload}


def _err(message: str) -> dict:
    return {"ok": False, "error": message}


class TvExecutor(Executor):
    """The SDK's executor plus the tv.* commands."""

    def __init__(self, account, bridge):
        super().__init__(account)
        self.bridge = bridge

    def run(self, command: str, params: dict, timeout_ms: int | None = None) -> dict:
        if not command.startswith("tv."):
            return super().run(command, params, timeout_ms)
        try:
            return self.run_tv(command, params or {})
        except (ValueError, RuntimeError) as exc:
            return _err(str(exc))
        except subprocess.TimeoutExpired:
            return _err("the TV did not answer (is it on the network with ADB on?)")

    def run_tv(self, command: str, params: dict) -> dict:
        bridge = self.bridge
        if command == "tv.set_timer":
            seconds = int(params.get("seconds", 0))
            if not 1 <= seconds <= 86400:
                raise ValueError("seconds must be 1 to 86400")
            timer = bridge.timers.add(time.time() + seconds, str(params.get("label") or ""), "timer")
            return _ok({"id": timer["id"], "rings_in_seconds": seconds,
                        "rings_at": datetime.fromtimestamp(timer["fires_at"]).strftime("%H:%M:%S")})
        if command == "tv.set_alarm":
            when = parse_alarm_time(str(params.get("time", "")))
            timer = bridge.timers.add(when.timestamp(), str(params.get("label") or ""), "alarm")
            return _ok({"id": timer["id"], "rings_at": when.strftime("%Y-%m-%d %H:%M")})
        if command == "tv.list_timers":
            now = time.time()
            return _ok({"now": datetime.now().strftime("%Y-%m-%d %H:%M:%S"), "timers": [
                {"id": t["id"], "kind": t["kind"], "label": t["label"],
                 "rings_at": datetime.fromtimestamp(t["fires_at"]).strftime("%Y-%m-%d %H:%M:%S"),
                 "seconds_left": int(t["fires_at"] - now)} for t in bridge.timers.list()]})
        if command == "tv.cancel_timer":
            timer_id = str(params.get("id", ""))
            if timer_id == "all":
                timers = bridge.timers.list()
                for t in timers:
                    bridge.timers.cancel(t["id"])
                return _ok({"cancelled": len(timers)})
            if not bridge.timers.cancel(timer_id):
                raise ValueError(f"no timer with id {timer_id!r}")
            return _ok({"cancelled": 1})
        if command == "tv.say":
            text = str(params.get("text", "")).strip()[:1000]
            if not text:
                raise ValueError("text is empty")
            bridge.events.add({"type": "say", "text": text})
            return _ok({"queued": True})
        if command == "tv.key":
            key = str(params.get("key", "")).lower().replace(" ", "_")
            if key not in KEYCODES:
                raise ValueError(f"unknown key; use one of {', '.join(KEYCODES)}")
            times = max(1, min(20, int(params.get("times", 1))))
            result = adb(bridge.settings.tv_host, "shell", "input", "keyevent", *[KEYCODES[key]] * times)
            if result.returncode != 0:
                raise RuntimeError(result.stderr.strip() or "adb failed")
            return _ok({"pressed": key, "times": times})
        if command == "tv.open_app":
            app = str(params.get("app", "")).strip()
            package = APPS.get(app.lower(), app)
            if not _PACKAGE_RE.match(package):
                raise ValueError(f"unknown app {app!r}; known: {', '.join(APPS)}")
            result = adb(bridge.settings.tv_host, "shell", "monkey", "-p", package,
                         "-c", "android.intent.category.LEANBACK_LAUNCHER", "1")
            if result.returncode != 0 or "No activities found" in result.stdout:
                raise RuntimeError(f"couldn't open {package}; is it installed?")
            return _ok({"opened": package})
        raise ValueError(f"unknown command {command}")
