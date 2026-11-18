"""TV bridge: keeps the Pi connected to Muse and lets the TV app talk through it.

Runs Meta's Muse Linux gadget service (the `musegadget` package) in this process,
plus a small HTTP API on the LAN for the TV app:

    POST /ask            WAV voice note (or JSON {"text": ...}) -> Muse's reply
    GET  /audio/<id>     MP3 of a reply in Muse's voice
    GET  /events?after=N long-poll for things the TV should say or ring (alarms)
    GET  /health         is the Muse link up?

Every request except /health needs the bridge token in the X-Token header.
It also gives Muse extra gadget commands (tv.*, see tv_commands.py) so Muse can
set timers and alarms that ring on the TV, make the TV speak, and press TV keys.

Run `tvbridge.py fake` on any computer to test the TV app without Muse: it
answers with an echo and uses the TV's own voice.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import secrets
import sys
import time
import uuid
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

from tv_store import EventLog, Settings, TimerStore

log = logging.getLogger("tvbridge")

PORT = int(os.environ.get("TVBRIDGE_PORT", "8790"))
STATE_DIR = Path(os.environ.get("TVBRIDGE_STATE", "/var/lib/tvbridge"))
MAX_BODY = 3 * 1024 * 1024
ASK_TIMEOUT_S = 120
AUDIO_KEEP_S = 600
EVENTS_WAIT_S = 25

VOICE_HINT = (
    "[Spoken to the living-room TV through the TV gadget. Answer in one to three short "
    "spoken sentences, no markdown or lists. For timers, alarms, making the TV speak, TV "
    "keys or opening TV apps, use the tv.* commands on the TV gadget.]"
)


class Bridge:
    def __init__(self, settings: Settings, timers: TimerStore, events: EventLog, *, fake: bool = False):
        self.settings = settings
        self.timers = timers
        self.events = events
        self.fake = fake
        self.service = None  # musegadget Service, set in main()
        self.loop: asyncio.AbstractEventLoop | None = None
        self.audio: dict[str, tuple[float, bytes]] = {}
        self._ask_lock = asyncio.Lock()
        self._scope = None

    # -- Muse ---------------------------------------------------------------

    def connected(self) -> bool:
        if self.fake:
            return True
        session = getattr(self.service, "_current", None)
        return session is not None and session.registered_at is not None

    async def ask(self, wav: bytes | None, text: str | None) -> dict:
        if self.fake:
            heard = text or f"a {len(wav or b'') // 32000} second voice note"
            return {"ok": True, "text": f"Fake bridge here. I got {heard}.", "audio": []}
        if not self.connected():
            return {"ok": False, "error": "The Pi is not connected to Muse right now."}
        async with self._ask_lock:  # one conversation turn at a time
            return await asyncio.wait_for(self._ask(wav, text), ASK_TIMEOUT_S + 15)

    async def _ask(self, wav: bytes | None, text: str | None) -> dict:
        from musegadget.muse_turn import MuseTurn, ReplayScope

        session = self.service._current
        sid = self.settings.session_id
        if self._scope is None:
            self._scope = ReplayScope()
        queue: asyncio.Queue = asyncio.Queue()

        async def pump():
            async for event in session.subscribe_chat(sid):
                queue.put_nowait(event)

        pump_task = asyncio.create_task(pump())
        try:
            await asyncio.wait_for(session.chat_subscribed.wait(), 15)
            await asyncio.sleep(0.3)
            while not queue.empty():  # replays of older turns
                self._scope.observe_idle(queue.get_nowait(), sid)
            if wav:
                resp = await session.send_voice(wav, sid, message=VOICE_HINT, output_modality="voice")
            else:
                resp = await session.send_chat(f"{VOICE_HINT}\n\n{text}", sid, output_modality="voice")
            if not resp.get("ok"):
                log.warning("Muse refused the request: %s", resp)
                return {"ok": False, "error": f"Muse said HTTP {resp.get('status')}"}
            ack = resp.get("response") or {}
            try:
                turn = MuseTurn(sid, owns_chat=True, replay_scope=self._scope)
                turn.acknowledge(ack)
            except ValueError as exc:
                log.info("side chat not confirmed as the gadget's own (%s); following by parent", exc)
                turn = MuseTurn(sid)
                turn.acknowledge(ack)
            started = time.monotonic()
            while True:
                now = time.monotonic()
                has_text = any(r.text.strip() for r in turn.replies.values())
                if (has_text and turn.complete(now)) or turn.settled(now) or now - started > ASK_TIMEOUT_S:
                    break
                try:
                    event = await asyncio.wait_for(queue.get(), 0.25)
                except asyncio.TimeoutError:
                    continue
                turn.feed(event)
            turn.retire()
        finally:
            pump_task.cancel()

        replies = [r for r in turn.replies.values() if r.text.strip()]
        audio = []
        for reply in replies:
            mp3 = await self._tts(session, reply.message_id)
            if mp3:
                audio_id = uuid.uuid4().hex
                self.audio[audio_id] = (time.time(), mp3)
                audio.append(f"/audio/{audio_id}")
        self._prune_audio()
        text_out = "\n\n".join(r.text.strip() for r in replies)
        if not text_out:
            return {"ok": False, "error": "Muse didn't answer in time."}
        return {"ok": True, "text": text_out, "audio": audio}

    async def _tts(self, session, message_id: str) -> bytes | None:
        try:
            parts = bytearray()
            async for chunk in session.stream_tts(message_id):
                parts += chunk
            return bytes(parts) or None
        except Exception as exc:  # the TV falls back to its own voice
            log.info("no Muse voice for %s: %s", message_id, exc)
            return None

    def _prune_audio(self) -> None:
        cutoff = time.time() - AUDIO_KEEP_S
        for key in [k for k, (t, _) in self.audio.items() if t < cutoff]:
            del self.audio[key]

    # -- Timers -------------------------------------------------------------

    async def timer_loop(self) -> None:
        while True:
            for timer in self.timers.pop_due(time.time()):
                log.info("timer %s fired: %s", timer["id"], timer.get("label"))
                self.events.add({"type": "alarm", "timer_id": timer["id"], "label": timer.get("label") or "",
                                 "kind": timer.get("kind", "timer")})
                if not self.fake:
                    from tv_commands import wake_tv
                    await asyncio.to_thread(wake_tv, self.settings.tv_host)
            await asyncio.sleep(1)

    # -- HTTP ---------------------------------------------------------------

    async def handle(self, reader: asyncio.StreamReader, writer: asyncio.StreamWriter) -> None:
        try:
            method, target, headers, body = await read_request(reader)
            status, ctype, payload = await self.route(method, target, headers, body)
        except asyncio.IncompleteReadError:
            writer.close()
            return
        except Exception as exc:
            log.exception("request failed")
            status, ctype, payload = 500, "application/json", json.dumps({"ok": False, "error": str(exc)}).encode()
        head = (f"HTTP/1.1 {status} {REASONS.get(status, 'OK')}\r\nContent-Type: {ctype}\r\n"
                f"Content-Length: {len(payload)}\r\nConnection: close\r\n\r\n")
        writer.write(head.encode() + payload)
        try:
            await writer.drain()
        finally:
            writer.close()

    async def route(self, method: str, target: str, headers: dict, body: bytes):
        url = urlsplit(target)
        path = url.path
        if path == "/health":
            return jsonr(200, {"ok": True, "muse": self.connected(), "fake": self.fake})
        if not secrets.compare_digest(headers.get("x-token", ""), self.settings.token):
            return jsonr(401, {"ok": False, "error": "wrong or missing X-Token"})
        if path == "/ask" and method == "POST":
            ctype = headers.get("content-type", "")
            if ctype.startswith("application/json"):
                text = (json.loads(body or b"{}").get("text") or "").strip()
                if not text:
                    return jsonr(400, {"ok": False, "error": "empty text"})
                result = await self.ask(None, text)
            else:
                if not body.startswith(b"RIFF"):
                    return jsonr(400, {"ok": False, "error": "expected a WAV body"})
                result = await self.ask(body, None)
            return jsonr(200 if result.get("ok") else 502, result)
        if path.startswith("/audio/") and method == "GET":
            item = self.audio.get(path.rsplit("/", 1)[-1])
            if not item:
                return jsonr(404, {"ok": False, "error": "gone"})
            return 200, "audio/mpeg", item[1]
        if path == "/events" and method == "GET":
            after = int((parse_qs(url.query).get("after") or ["0"])[0] or 0)
            items = await self.events.wait_after(after, EVENTS_WAIT_S)
            return jsonr(200, {"ok": True, "events": items, "last": self.events.last_id})
        if path == "/timers" and method == "GET":
            return jsonr(200, {"ok": True, "timers": self.timers.list()})
        if path == "/say" and method == "POST":  # handy for testing from a laptop
            text = (json.loads(body or b"{}").get("text") or "").strip()
            self.events.add({"type": "say", "text": text})
            return jsonr(200, {"ok": True})
        return jsonr(404, {"ok": False, "error": "no such endpoint"})


REASONS = {200: "OK", 400: "Bad Request", 401: "Unauthorized", 404: "Not Found", 413: "Too Large",
           500: "Internal Server Error", 502: "Bad Gateway"}


def jsonr(status: int, obj: dict):
    return status, "application/json", json.dumps(obj).encode()


async def read_request(reader: asyncio.StreamReader):
    line = (await asyncio.wait_for(reader.readline(), 15)).decode("latin-1").strip()
    if not line:
        raise asyncio.IncompleteReadError(b"", None)
    method, target, _ = line.split(" ", 2)
    headers: dict[str, str] = {}
    while True:
        raw = (await asyncio.wait_for(reader.readline(), 15)).decode("latin-1")
        if raw in ("\r\n", "\n", ""):
            break
        key, _, value = raw.partition(":")
        headers[key.strip().lower()] = value.strip()
    length = int(headers.get("content-length") or 0)
    if length > MAX_BODY:
        raise ValueError("request body too large")
    body = await asyncio.wait_for(reader.readexactly(length), 60) if length else b""
    return method.upper(), target, headers, body


async def serve(bridge: Bridge) -> asyncio.AbstractServer:
    bridge.loop = asyncio.get_running_loop()
    server = await asyncio.start_server(bridge.handle, "0.0.0.0", PORT, limit=64 * 1024)
    log.info("TV bridge listening on port %d", PORT)
    return server


def make_bridge(fake: bool) -> Bridge:
    state = STATE_DIR if not fake else Path(os.environ.get("TVBRIDGE_STATE", "./tvbridge-state"))
    state.mkdir(parents=True, exist_ok=True)
    settings = Settings.load(state)
    return Bridge(settings, TimerStore(state / "timers.json"), EventLog(), fake=fake)


def run_fake() -> None:
    bridge = make_bridge(fake=True)
    print(f"Fake TV bridge on port {PORT}. Token: {bridge.settings.token}")

    async def main():
        server = await serve(bridge)
        asyncio.create_task(bridge.timer_loop())
        async with server:
            await server.serve_forever()

    asyncio.run(main())


def run_real() -> None:
    import signal

    from musegadget import config, identity
    from musegadget import service as service_mod
    from musegadget.executor import Account
    from tv_commands import TV_COMMAND_SPECS, TvExecutor

    bridge = make_bridge(fake=False)
    run_as = os.environ.get("MUSEGADGET_RUN_AS")
    account = Account.lookup(run_as) if (os.geteuid() == 0 and run_as) else Account.current()
    try:
        sdk_token = config.sdk_token()
    except ValueError:
        sdk_token = None
    # The gadget registers COMMAND_SPECS with Muse; add the TV commands to it.
    service_mod.COMMAND_SPECS = {**service_mod.COMMAND_SPECS, **TV_COMMAND_SPECS}

    async def main():
        executor = TvExecutor(account, bridge)
        service = service_mod.Service(identity=identity.load_or_create(), executor=executor,
                                      sdk_token=sdk_token, display_name="Living room TV")
        bridge.service = service
        loop = asyncio.get_running_loop()
        for signum in (signal.SIGTERM, signal.SIGINT):
            loop.add_signal_handler(signum, service.stop)
        local = await service.serve_local(config.socket_path())
        http = await serve(bridge)
        timers = asyncio.create_task(bridge.timer_loop())
        try:
            await service.run()
        finally:
            timers.cancel()
            http.close()
            local.close()

    asyncio.run(main())


def main(argv: list[str]) -> int:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
    cmd = argv[1] if len(argv) > 1 else "run"
    if cmd == "fake":
        run_fake()
    elif cmd == "run":
        run_real()
    elif cmd == "info":
        bridge = make_bridge(fake=False)
        print(json.dumps({"port": PORT, "token": bridge.settings.token, "tv_host": bridge.settings.tv_host,
                          "side_chat": bridge.settings.session_id}, indent=2))
    elif cmd == "set-tv":
        bridge = make_bridge(fake=False)
        bridge.settings.tv_host = argv[2]
        bridge.settings.save()
        print(f"TV address set to {argv[2]}")
    else:
        print("usage: tvbridge.py [run|fake|info|set-tv <ip>]")
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
