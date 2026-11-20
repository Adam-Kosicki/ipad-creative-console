# Tests for the embedded-Python side of the TV app, run on a normal computer.
import asyncio, json, sys, time, types, threading
sys.path.insert(0, str(__import__("pathlib").Path(__file__).resolve().parents[1] / "app/src/main/python"))
java = types.ModuleType("java")
java.jclass = lambda name: type("J", (), {"__init__": lambda self, *a: None})
java.dynamic_proxy = lambda c: object
sys.modules["java"] = java
import tvgadget

class Host:
    def __init__(self): self.timers = []; self.said = []; self.statuses = []; self.approved = []
    def setTimer(self, at, label, kind): self.timers.append((at, label, kind)); return "abc123"
    def listTimers(self): return json.dumps([{"id": "abc123"}])
    def cancelTimer(self, i): return 1
    def say(self, t): self.said.append(t)
    def volume(self, a, l): return json.dumps({"level_percent": 40})
    def media(self, k): pass
    def openApp(self, a): return "error: nope isn't installed" if a == "nope" else "com.netflix.ninja"
    def youtube(self, v): return "search: " + v
    def goHome(self): pass
    def status(self, p, t): self.statuses.append((p, t))
    def approvals(self, j): self.approved.append(json.loads(j))

def test_setup_and_commands(tmp_path):
    host = Host()
    tvgadget.setup(None, str(tmp_path / "state"), str(tmp_path), host)
    st = json.loads(tvgadget.status())
    assert st["paired"] is False and st["ble_name"].startswith("MuseGadget") and st["has_token"] is False
    assert tvgadget.save_sdk_token("bad") != "ok"
    good = "mgst_" + "A" * 42 + "A"
    assert tvgadget.save_sdk_token(good) == "ok" and tvgadget.has_sdk_token()
    ex = tvgadget.TvExecutor()
    r = ex.run("tv.set_timer", {"seconds": 3600, "label": "pizza"}); assert r["ok"] and host.timers[0][1] == "pizza"
    assert ex.run("tv.set_alarm", {"time": "07:30"})["ok"]
    assert ex.run("tv.say", {"text": "hi"})["ok"] and host.said == ["hi"]
    assert ex.run("tv.open_app", {"app": "nope"})["ok"] is False
    assert ex.run("tv.youtube", {"video": "lofi"})["payload"]["opened"] == "search: lofi"
    assert ex.run("tv.volume", {"action": "set", "level": 40})["payload"]["level_percent"] == 40
    assert ex.run("system.run", {"command": "ls"})["ok"] is False
    import musegadget.ble_server as b; assert b.__name__ == "android_ble"

def test_ask_flow(tmp_path):
    host = Host()
    tvgadget.setup(None, str(tmp_path / "state"), str(tmp_path), host)
    sid = tvgadget._session_id()
    class S:
        registered_at = 1.0
        def __init__(self): self.chat_subscribed = asyncio.Event(); self.sent = None
        async def subscribe_chat(self, s):
            self.chat_subscribed.set()
            while self.sent is None: await asyncio.sleep(0.01)
            for name, extra in [("delta.text_append", {"text": "Done"}), ("delta.message_done", {"display_text": "Done, timer set."}),
                                ("task.status", {"status": "completed"})]:
                await asyncio.sleep(0.01)
                yield {"type": "event", "event": name, "payload": {"session_id": sid, "message_id": "a1", "reply_to_message_id": "u1", **extra}}
            await asyncio.sleep(99)
        async def send_voice(self, wav, s, message="", output_modality=None):
            self.sent = wav; return {"ok": True, "status": 200, "response": {"result": {"message_id": "u1", "session_id": sid, "is_thread": True}}}
        async def stream_tts(self, mid): yield b"ID3xx"
    loop = asyncio.new_event_loop()
    threading.Thread(target=loop.run_forever, daemon=True).start()
    tvgadget._loop = loop
    tvgadget._ask_lock = asyncio.Lock()
    session = S()
    tvgadget._service = types.SimpleNamespace(_current=session)
    out = json.loads(tvgadget.ask(b"RIFFdata"))
    assert out["ok"] and out["text"] == "Done, timer set." and out["audio_files"] == []  # FAST_SPEECH: TV voice


def test_status_and_approvals(tmp_path):
    host = Host()
    tvgadget.setup(None, str(tmp_path), str(tmp_path), host) if False else None
    tvgadget._host = host
    tvgadget._last_status = ("", "")
    tvgadget._emit_status({"event": "agent.status", "payload": {"activity_code": "working", "activity_text": "Searching the Play Store"}})
    tvgadget._emit_status({"event": "task.status", "payload": {"status": "completed"}})
    assert host.statuses == [("working", "Searching the Play Store"), ("done", "")]
    snap = {"approvals": [{"approval_id": "a1", "status": "pending", "title": "Install Spotify"},
                          {"id": "a2", "status": "approved", "title": "old"}]}
    tvgadget._emit_status({"event": "approvals.snapshot", "payload": snap})
    assert host.approved[-1] == [{"id": "a1", "title": "Install Spotify", "detail": ""}]
    tvgadget._emit_status({"event": "approvals.snapshot", "payload": {"approvals": []}})
    assert host.approved[-1] == []
