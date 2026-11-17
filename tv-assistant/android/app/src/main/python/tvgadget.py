"""The TV as a Muse gadget, no Pi needed.

Runs Meta's Muse gadget SDK (vendored `musegadget`) inside the TV app: Bluetooth pairing
with the Muse app, the always-on encrypted link to the user's Muse, voice requests, and
`tv.*` commands Muse can call back into the TV (timers, alarms, speech, volume, apps).
Java calls the module functions below; `host` is the Java TvHost object.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import sys
import threading
import time
import types
import uuid
from datetime import datetime, timedelta

log = logging.getLogger("tvgadget")

ASK_TIMEOUT_S = 120
# The device's usage guide, which Muse reads through device.guide (the SDK's way to tell Muse how
# to use a gadget; at most 4096 bytes). Requests go out with output_modality="voice", so nothing is
# added to what the user says.
DEVICE_GUIDE = """# Living room TV

A Sony Google TV in the living room, running the TV Assistant app. The owner talks to it:
"Hey Jarvis", then a request. The TV sends what they said to Muse and reads Muse's answer
out loud in its own voice.

## Answering requests from this TV

- Every message from this gadget was spoken out loud at the TV, and the answer is read
  aloud. Answer in one to three short spoken sentences, with no markdown, lists or links.
- If a task takes a while, say so briefly, then send the result as its own message: the TV
  speaks every message on its chat.

## Its commands

- tv.open_app and tv.youtube open apps and YouTube videos or searches on this TV.
- tv.volume, tv.media and tv.home control the TV like its remote.
- tv.say speaks a sentence on the TV right away.
- tv.set_timer, tv.set_alarm, tv.list_timers and tv.cancel_timer manage timers that ring
  on the TV.

## Limits

- No screenshots, and no reading what is on screen or which app is in front.
- It can't install apps, and can't turn the TV on once it is off.
"""

_state = {"paired": False, "connected": False, "pairing": "", "ble_name": "", "error": ""}
_host = None
_service = None
_loop: asyncio.AbstractEventLoop | None = None
_ask_lock: asyncio.Lock | None = None
_scope = None
_follower = None
_audio_dir = ""


def setup(context, state_dir: str, audio_dir: str, host) -> None:
    """Call once at app start, before anything else."""
    global _host, _audio_dir
    _host = host
    _audio_dir = audio_dir
    os.makedirs(state_dir, exist_ok=True)
    os.environ["MUSEGADGET_STATE_DIR"] = state_dir
    try:
        import certifi
        os.environ.setdefault("SSL_CERT_FILE", certifi.where())
    except ImportError:
        pass
    try:
        import pwd  # noqa: F401  (the SDK's executor imports it)
    except ImportError:
        sys.modules["pwd"] = types.ModuleType("pwd")
    logging.basicConfig(level=logging.INFO, stream=sys.stderr,
                        format="%(name)s %(levelname)s %(message)s", force=True)
    import android_ble
    android_ble.BleServer.context = context
    sys.modules["musegadget.ble_server"] = android_ble  # pairing uses our Bluetooth server
    from musegadget import config, identity
    _state["ble_name"] = identity.load_or_create().ble_name
    _state["paired"] = bool(config.load_json(config.PAIRING_FILE))


def save_sdk_token(token: str) -> str:
    from musegadget import config
    token = token.strip()
    path = config.state_dir() / config.SDK_TOKEN_FILE
    path.write_text(token, encoding="utf-8")
    os.chmod(path, 0o600)
    try:
        config.sdk_token()
        return "ok"
    except ValueError as exc:
        path.unlink()
        return str(exc)


def import_pairing(bundle_b64: str) -> str:
    """Take over a Muse pairing made elsewhere (pc_pair.py) for TVs that can't advertise over BLE."""
    import base64
    from musegadget import config
    try:
        bundle = json.loads(base64.urlsafe_b64decode(bundle_b64.strip() + "=="))
        ident, pairing = bundle["identity"], bundle["pairing"]
        if not ident.get("mac") or not pairing.get("refresh_token"):
            return "that pairing is incomplete"
    except Exception as exc:
        return f"couldn't read the pairing: {exc}"
    config.save_json(config.IDENTITY_FILE, ident)
    config.save_json(config.PAIRING_FILE, pairing)
    from musegadget import identity
    _state["ble_name"] = identity.load_or_create().ble_name
    _state["paired"] = True
    if _service is not None:  # the running link was built with the old identity
        _service.identity = identity.load_or_create()
    return "ok"


def has_sdk_token() -> bool:
    from musegadget import config
    try:
        return bool(config.sdk_token())
    except ValueError:
        return False


def status() -> str:
    from musegadget import config
    _state["paired"] = bool(config.load_json(config.PAIRING_FILE))
    session = getattr(_service, "_current", None)
    _state["connected"] = bool(session is not None and session.registered_at is not None)
    _state["has_token"] = has_sdk_token()
    return json.dumps(_state)


# -- The link to Muse ---------------------------------------------------------------

def start() -> None:
    """Keep the TV connected to Muse in a background thread (waits quietly until paired)."""
    if _loop is not None:
        return
    ready = threading.Event()
    threading.Thread(target=_run_service, args=(ready,), name="muse-link", daemon=True).start()
    ready.wait(10)


def _run_service(ready: threading.Event) -> None:
    global _service, _loop, _ask_lock
    from musegadget import config, identity
    from musegadget import service as service_mod

    service_mod.COMMAND_SPECS = TV_COMMAND_SPECS
    _loop = asyncio.new_event_loop()
    asyncio.set_event_loop(_loop)
    _ask_lock = asyncio.Lock()
    try:
        sdk_token = config.sdk_token()
    except ValueError:
        sdk_token = None
    _service = service_mod.Service(identity=identity.load_or_create(), executor=TvExecutor(),
                                   sdk_token=sdk_token, display_name="Living room TV")
    ready.set()
    while True:  # Service.run returns only when stopped; restart it if it ever dies
        try:
            _loop.run_until_complete(_service.run())
        except Exception:
            log.exception("Muse link crashed; restarting")
        time.sleep(5)


def pair() -> None:
    """Open Bluetooth pairing for 10 minutes in the background. Watch status()."""
    if _state["pairing"] == "open":
        return

    def run():
        from musegadget import pair as pair_mod
        _state["pairing"] = "open"
        _state["error"] = ""
        try:
            result = pair_mod.pair(on_open=lambda w: log.info("pairing open as %s", w.ble_name), force=True)
            _state["pairing"] = result.outcome.value
            import android_ble
            if android_ble.LAST_ERROR:
                _state["error"] = android_ble.LAST_ERROR
                android_ble.LAST_ERROR = ""
            if result.sdk_token_problem:
                _state["error"] = result.sdk_token_problem
            if result.outcome.value == "paired":
                _state["paired"] = True
        except Exception as exc:
            log.exception("pairing failed")
            _state["pairing"] = "failed"
            _state["error"] = f"{type(exc).__name__}: {exc}"

    threading.Thread(target=run, name="muse-pair", daemon=True).start()


# Speak Muse's text in the TV's own voice right away instead of waiting for Muse's audio.
FAST_SPEECH = True


def ask(wav: bytes, text: str = "") -> str:
    """Send a voice note (or text) to Muse and wait for the answer. Returns JSON."""
    if _loop is None:
        return json.dumps({"ok": False, "error": "The Muse link isn't running."})
    session = getattr(_service, "_current", None)
    if session is None or session.registered_at is None:
        msg = "I'm not paired with Muse yet." if not _state["paired"] else "I can't reach Muse right now."
        return json.dumps({"ok": False, "error": msg})
    future = asyncio.run_coroutine_threadsafe(_ask(session, bytes(wav) if wav else None, text), _loop)
    try:
        return json.dumps(future.result(ASK_TIMEOUT_S + 20))
    except Exception as exc:
        future.cancel()
        log.exception("ask failed")
        return json.dumps({"ok": False, "error": f"Muse didn't answer ({type(exc).__name__})."})


def _session_id() -> str:
    from musegadget import config
    data = config.load_json("tv.json") or {}
    if not data.get("session_id"):
        data["session_id"] = str(uuid.uuid4())  # the TV's own Muse side chat
        config.save_json("tv.json", data)
    return data["session_id"]


async def _ask(session, wav: bytes | None, text: str) -> dict:
    global _scope
    from musegadget.muse_turn import MuseTurn, ReplayScope

    global _follower
    if _follower is not None and not _follower.done():
        _follower.cancel()  # a new request: stop speaking leftovers from the last one
    _follower = None
    async with _ask_lock:
        sid = _session_id()
        if _scope is None:
            _scope = ReplayScope()
        queue: asyncio.Queue = asyncio.Queue()
        pump_task = None

        async def subscribe(target, wait_s):
            """Open Muse's chat event stream; True once the server confirms it."""
            nonlocal pump_task

            async def pump():
                async for event in session.subscribe_chat(target):
                    queue.put_nowait(event)

            session.chat_subscribed.clear()
            task = asyncio.create_task(pump())
            task.add_done_callback(lambda t: t.cancelled() or not t.exception() or log.warning(
                "chat subscription (%s) ended: %r", target or "main chat", t.exception()))
            try:
                await asyncio.wait_for(session.chat_subscribed.wait(), wait_s)
                pump_task = task
                log.info("subscribed to %s", target or "the main chat")
                return True
            except asyncio.TimeoutError:
                log.warning("chat subscription (%s) not confirmed after %ss", target or "main chat", wait_s)
                task.cancel()
                return False

        try:
            # A brand-new side chat may not accept a subscription until its first message exists,
            # so try it first, and otherwise send and subscribe right after (Muse replays the turn).
            subscribed = await subscribe(sid, 6)
            if subscribed:
                await asyncio.sleep(0.3)
                while not queue.empty():
                    _scope.observe_idle(queue.get_nowait(), sid)
            log.info("sending %s to Muse", "a voice note" if wav else "text")
            if wav:
                resp = await session.send_voice(wav, sid, output_modality="voice")
            else:
                resp = await session.send_chat(text, sid, output_modality="voice")
            log.info("Muse acknowledged: ok=%s status=%s", resp.get("ok"), resp.get("status"))
            if not resp.get("ok"):
                log.warning("Muse refused the request: %s", resp)
                return {"ok": False, "error": f"Muse said HTTP {resp.get('status')}."}
            if not subscribed:
                subscribed = await subscribe(sid, 15) or await subscribe(None, 15)
            if not subscribed:
                return {"ok": False, "error": "I sent it to Muse but can't hear the answer. Check the Muse app."}
            ack = resp.get("response") or {}
            try:
                turn = MuseTurn(sid, owns_chat=True, replay_scope=_scope)
                turn.acknowledge(ack)
            except ValueError as exc:
                log.info("side chat not confirmed as the gadget's own (%s); following by parent", exc)
                turn = MuseTurn(sid)
                turn.acknowledge(ack)
            started = time.monotonic()
            message_done = False
            heard = ""
            while True:
                now = time.monotonic()
                has_text = any(r.text.strip() for r in turn.replies.values())
                # Speak as soon as Muse's first message is finished; later messages follow below.
                if has_text and (message_done or turn.complete(now)):
                    break
                if turn.settled(now) or now - started > ASK_TIMEOUT_S:
                    break
                try:
                    event = await asyncio.wait_for(queue.get(), 0.25)
                except asyncio.TimeoutError:
                    continue
                name = event.get("event")
                if name not in ("delta.text_append",):
                    log.info("chat event %s", name)
                if name == "message.user":
                    said = _user_text(event)
                    if said and said != heard:
                        heard = said
                        _show_heard(heard)
                turn.feed(event)
                if name == "delta.message_done":
                    message_done = True
            replies = [r for r in turn.replies.values() if r.text.strip()]
            if replies and pump_task is not None:
                # Muse may send more messages (e.g. after a tool call): keep listening and speak them too.
                _follower = asyncio.ensure_future(
                    _follow_rest(turn, queue, pump_task, {r.message_id for r in replies}))
                pump_task = None
            else:
                turn.retire()
        finally:
            if pump_task is not None:
                pump_task.cancel()

        files = []
        for reply in replies if not FAST_SPEECH else []:
            try:
                mp3 = bytearray()
                async for chunk in session.stream_tts(reply.message_id):
                    mp3 += chunk
                if mp3:
                    path = os.path.join(_audio_dir, f"reply-{uuid.uuid4().hex[:8]}.mp3")
                    with open(path, "wb") as f:
                        f.write(mp3)
                    files.append(path)
            except Exception as exc:  # the TV falls back to its own voice
                log.info("no Muse voice for %s: %s", reply.message_id, exc)
        text_out = "\n\n".join(r.text.strip() for r in replies)
        if not text_out:
            return {"ok": False, "error": "Muse didn't answer in time."}
        return {"ok": True, "text": text_out, "audio_files": files, "heard": heard}


def _user_text(event: dict) -> str:
    """Muse's transcription of the user's message, from a message.user event."""
    payload = event.get("payload") or {}
    for key in ("transcript", "text", "display_text", "content"):
        value = payload.get(key)
        if isinstance(value, str):
            text = value.strip()
            if text:
                return text
    log.info("message.user without text; keys: %s", sorted(payload))
    return ""


def _show_heard(text: str) -> None:
    try:
        _host.heard(text)
    except Exception:
        log.exception("could not show the transcription")


FOLLOW_UP_S = 300  # keep listening this long after the last Muse activity for slow follow-ups


async def _follow_rest(turn, queue: asyncio.Queue, pump_task, spoken: set) -> None:
    """After the first answer is spoken, speak every further message Muse sends on the TV's chat.

    Muse often answers in two steps ("On it…", then the result after a tool runs), and the
    second can come a while later, after the turn looks finished. So this keeps listening until
    Muse has been quiet for FOLLOW_UP_S seconds, or the next request starts.
    """
    log.info("following Muse's further messages (up to %ss of quiet)", FOLLOW_UP_S)
    last = time.monotonic()
    reason = "quiet"
    try:
        while time.monotonic() - last < FOLLOW_UP_S:
            try:
                event = await asyncio.wait_for(queue.get(), 1.0)
            except asyncio.TimeoutError:
                if pump_task.done():
                    reason = "subscription closed"
                    break
                continue
            last = time.monotonic()
            name = event.get("event")
            payload = event.get("payload") or {}
            if name == "task.status":
                log.info("chat event task.status %s (follow-up)", payload.get("status"))
            elif name not in ("delta.text_append",):
                log.info("chat event %s (follow-up)", name)
            turn.feed(event)
            for reply in list(turn.replies.values()):
                if reply.done and reply.text.strip() and reply.message_id not in spoken:
                    spoken.add(reply.message_id)
                    log.info("speaking a further Muse message")
                    _host.say(reply.text.strip())
    except asyncio.CancelledError:
        reason = "next request"
    except Exception:
        reason = "error"
        log.exception("following Muse's further messages failed")
    finally:
        log.info("stopped following Muse (%s)", reason)
        pump_task.cancel()
        try:
            turn.retire()
        except Exception:
            pass


# -- Commands Muse can run on the TV ---------------------------------------------------

TV_COMMAND_SPECS = {
    "tv.set_timer": {
        "description": "Start a countdown timer that rings and speaks on the living-room TV.",
        "required": {"seconds": {"type": "integer", "description": "Length in seconds (1 to 86400)."}},
        "optional": {"label": {"type": "string", "description": "What it's for, spoken when it rings."}},
    },
    "tv.set_alarm": {
        "description": ("Set an alarm that rings on the TV at a clock time in the TV's time zone. "
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
    "tv.volume": {
        "description": "Change the TV volume: up, down, mute, unmute, or set (with level 0-100). Returns the level.",
        "required": {"action": {"type": "string", "description": "up, down, mute, unmute or set."}},
        "optional": {"level": {"type": "integer", "description": "For set: 0 to 100 percent."},
                     "steps": {"type": "integer", "description": "For up/down: 1 to 10 steps. Default 2."}},
    },
    "tv.media": {
        "description": "Control what's playing on the TV: play_pause, play, pause, next, previous, stop.",
        "required": {"key": {"type": "string", "description": "play_pause, play, pause, next, previous or stop."}},
    },
    "tv.open_app": {
        "description": "Open an app on the TV, e.g. youtube, netflix, spotify, plex, prime video, or a package name.",
        "required": {"app": {"type": "string", "description": "App name or Android package name."}},
    },
    "tv.youtube": {
        "description": ("Play a YouTube video on the TV. Give a video URL or id to play it, or words to "
                        "search YouTube on the TV for (e.g. 'lofi hip hop', 'Linus Tech Tips latest')."),
        "required": {"video": {"type": "string", "description": "YouTube URL, video id, or search words."}},
    },
    "tv.home": {"description": "Go to the TV's home screen."},
    "device.health": {"description": "Report the TV gadget's state: time, timers waiting, app version."},
    "device.guide": {"description": "This device's usage guide (Markdown): what it is, how to answer it, its controls and limits."},
}


def parse_alarm_time(value: str, now: datetime | None = None) -> datetime:
    import re
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


def _ok(payload: dict) -> dict:
    return {"ok": True, "payload": payload}


def _err(message: str) -> dict:
    return {"ok": False, "error": message}


class TvExecutor:
    """Runs Muse's commands by calling into the Java TvHost."""

    def run(self, command: str, params: dict, timeout_ms: int | None = None) -> dict:
        try:
            return self._run(command, params or {})
        except ValueError as exc:
            return _err(str(exc))
        except Exception as exc:
            log.exception("%s failed", command)
            return _err(f"{type(exc).__name__}: {exc}")

    def _run(self, command: str, p: dict) -> dict:
        host = _host
        if command == "tv.set_timer":
            seconds = int(p.get("seconds", 0))
            if not 1 <= seconds <= 86400:
                raise ValueError("seconds must be 1 to 86400")
            fire = time.time() + seconds
            timer_id = str(host.setTimer(int(fire * 1000), str(p.get("label") or ""), "timer"))
            return _ok({"id": timer_id, "rings_in_seconds": seconds,
                        "rings_at": datetime.fromtimestamp(fire).strftime("%H:%M:%S")})
        if command == "tv.set_alarm":
            when = parse_alarm_time(str(p.get("time", "")))
            timer_id = str(host.setTimer(int(when.timestamp() * 1000), str(p.get("label") or ""), "alarm"))
            return _ok({"id": timer_id, "rings_at": when.strftime("%Y-%m-%d %H:%M")})
        if command == "tv.list_timers":
            return _ok({"now": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        "timers": json.loads(str(host.listTimers()))})
        if command == "tv.cancel_timer":
            n = int(host.cancelTimer(str(p.get("id", ""))))
            if n == 0:
                raise ValueError("no timer with that id")
            return _ok({"cancelled": n})
        if command == "tv.say":
            text = str(p.get("text", "")).strip()[:1000]
            if not text:
                raise ValueError("text is empty")
            host.say(text)
            return _ok({"spoken": True})
        if command == "tv.volume":
            action = str(p.get("action", "")).lower()
            if action not in ("up", "down", "mute", "unmute", "set"):
                raise ValueError("action must be up, down, mute, unmute or set")
            level = int(p.get("level", -1)) if action == "set" else int(p.get("steps", 2))
            return _ok(json.loads(str(host.volume(action, level))))
        if command == "tv.media":
            key = str(p.get("key", "")).lower()
            if key not in ("play_pause", "play", "pause", "next", "previous", "stop"):
                raise ValueError("unknown key")
            host.media(key)
            return _ok({"sent": key})
        if command == "tv.open_app":
            result = str(host.openApp(str(p.get("app", ""))))
            if result.startswith("error:"):
                raise ValueError(result[6:].strip())
            return _ok({"opened": result})
        if command == "tv.youtube":
            result = str(host.youtube(str(p.get("video", "")).strip()))
            if result.startswith("error:"):
                raise ValueError(result[6:].strip())
            return _ok({"opened": result})
        if command == "tv.home":
            host.goHome()
            return _ok({"home": True})
        if command == "device.guide":
            return _ok({"format": "markdown", "guide": DEVICE_GUIDE})
        if command == "device.health":
            return _ok({"time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        "timers": json.loads(str(host.listTimers())), "app": "TV Assistant"})
        return _err(f"unsupported command: {command}")
