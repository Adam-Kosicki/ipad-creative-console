import asyncio
import json
import sys
import time
from datetime import datetime
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import tvbridge  # noqa: E402
from tv_commands import TvExecutor, parse_alarm_time  # noqa: E402
from tv_store import EventLog, Settings, TimerStore  # noqa: E402


def make(tmp_path, fake=False):
    return tvbridge.Bridge(Settings.load(tmp_path), TimerStore(tmp_path / "t.json"), EventLog(), fake=fake)


class FakeSession:
    """Mimics the parts of musegadget's LinkSession the bridge uses."""

    def __init__(self, sid, events):
        self.sid = sid
        self.registered_at = time.monotonic()
        self.chat_subscribed = asyncio.Event()
        self._events = events
        self.sent = None

    async def subscribe_chat(self, session_id=None):
        # a replay from an earlier turn arrives first
        self.chat_subscribed.set()
        yield {"type": "event", "event": "message.assistant",
               "payload": {"session_id": self.sid, "message_id": "old", "display_text": "old answer"}}
        while self.sent is None:
            await asyncio.sleep(0.01)
        for event in self._events:
            await asyncio.sleep(0.01)
            yield event
        await asyncio.sleep(3600)

    async def send_voice(self, wav, session_id=None, *, message="", output_modality=None):
        self.sent = ("voice", wav, session_id, output_modality)
        return {"ok": True, "status": 200,
                "response": {"result": {"message_id": "u1", "session_id": self.sid, "is_thread": True}}}

    async def send_chat(self, message, session_id=None, *, output_modality="text"):
        self.sent = ("text", message, session_id, output_modality)
        return {"ok": True, "status": 200,
                "response": {"result": {"message_id": "u1", "session_id": self.sid, "is_thread": True}}}

    async def stream_tts(self, message_id):
        yield b"ID3" + message_id.encode()


def ev(name, sid, **payload):
    return {"type": "event", "event": name, "payload": {"session_id": sid, **payload}}


def test_ask_follows_muse_reply_and_fetches_voice(tmp_path):
    bridge = make(tmp_path)
    sid = bridge.settings.session_id
    session = FakeSession(sid, [
        ev("agent.status", sid, activity_code="thinking"),
        ev("delta.text_append", sid, message_id="a1", reply_to_message_id="u1", text="Timer "),
        ev("delta.text_append", sid, message_id="a1", reply_to_message_id="u1", text="set"),
        ev("delta.message_done", sid, message_id="a1", reply_to_message_id="u1",
           display_text="Timer set for one hour."),
        ev("task.status", sid, status="completed", reply_to_message_id="u1"),
        ev("agent.status", sid, activity_code="idle"),
    ])

    class Service:
        _current = session

    bridge.service = Service()
    result = asyncio.run(bridge.ask(b"RIFF....WAVE", None))
    assert result["ok"], result
    assert result["text"] == "Timer set for one hour."
    assert session.sent[0] == "voice" and session.sent[3] == "voice"
    assert len(result["audio"]) == 1
    audio_id = result["audio"][0].rsplit("/", 1)[-1]
    assert bridge.audio[audio_id][1] == b"ID3a1"


def test_http_routes_fake_mode(tmp_path):
    bridge = make(tmp_path, fake=True)
    token = bridge.settings.token

    async def go():
        st, _, body = await bridge.route("GET", "/health", {}, b"")
        assert st == 200 and json.loads(body)["muse"] is True
        st, _, _ = await bridge.route("POST", "/ask", {"x-token": "nope"}, b"RIFF")
        assert st == 401
        st, _, body = await bridge.route("POST", "/ask", {"x-token": token}, b"RIFF" + b"\0" * 64000)
        assert st == 200 and "Fake bridge" in json.loads(body)["text"]
        st, _, body = await bridge.route("POST", "/ask", {"x-token": token, "content-type": "application/json"},
                                         json.dumps({"text": "hi"}).encode())
        assert "hi" in json.loads(body)["text"]
        # events: long-poll wakes up when something is added
        waiter = asyncio.create_task(bridge.route("GET", "/events?after=0", {"x-token": token}, b""))
        await asyncio.sleep(0.05)
        await bridge.route("POST", "/say", {"x-token": token}, json.dumps({"text": "hello"}).encode())
        st, _, body = await asyncio.wait_for(waiter, 2)
        data = json.loads(body)
        assert data["events"][0]["text"] == "hello" and data["last"] == 1

    asyncio.run(go())


def test_timer_commands_ring_through_events(tmp_path):
    bridge = make(tmp_path, fake=True)

    class Account:
        name = "pi"

    ex = TvExecutor(Account(), bridge)
    r = ex.run("tv.set_timer", {"seconds": 1, "label": "pizza"})
    assert r["ok"] and r["payload"]["rings_in_seconds"] == 1
    assert ex.run("tv.set_timer", {"seconds": 0})["ok"] is False
    listed = ex.run("tv.list_timers", {})["payload"]["timers"]
    assert listed[0]["label"] == "pizza"

    async def go():
        task = asyncio.create_task(bridge.timer_loop())
        items = await bridge.events.wait_after(0, 4)
        task.cancel()
        return items

    items = asyncio.run(go())
    assert items[0]["type"] == "alarm" and items[0]["label"] == "pizza"
    assert bridge.timers.list() == []
    # survives restart
    ex.run("tv.set_alarm", {"time": "07:30", "label": "work"})
    assert TimerStore(tmp_path / "t.json").list()[0]["label"] == "work"
    assert ex.run("tv.cancel_timer", {"id": "all"})["payload"]["cancelled"] == 1
    assert ex.run("tv.key", {"key": "launch_missiles"})["ok"] is False


def test_parse_alarm_time():
    now = datetime(2026, 11, 17, 22, 0)
    assert parse_alarm_time("07:30", now) == datetime(2026, 11, 18, 7, 30)
    assert parse_alarm_time("23:15", now) == datetime(2026, 11, 17, 23, 15)
    with pytest.raises(ValueError):
        parse_alarm_time("25:00", now)


def test_settings_persist(tmp_path):
    a = Settings.load(tmp_path)
    b = Settings.load(tmp_path)
    assert a.token == b.token and a.session_id == b.session_id
