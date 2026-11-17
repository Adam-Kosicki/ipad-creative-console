"""Small persistent state for the TV bridge: settings, timers and the event log."""

from __future__ import annotations

import asyncio
import json
import os
import secrets
import threading
import time
import uuid
from dataclasses import asdict, dataclass, field
from pathlib import Path


def _write_json(path: Path, data) -> None:
    tmp = path.with_suffix(".tmp")
    tmp.write_text(json.dumps(data, indent=2))
    os.chmod(tmp, 0o600)
    tmp.replace(path)


@dataclass
class Settings:
    path: Path
    token: str = field(default_factory=lambda: secrets.token_urlsafe(24))
    session_id: str = field(default_factory=lambda: str(uuid.uuid4()))  # the TV's Muse side chat
    tv_host: str = ""  # TV IP, for adb (wake it up when an alarm rings, keys, apps)

    @classmethod
    def load(cls, directory: Path) -> "Settings":
        path = directory / "settings.json"
        data = {}
        if path.exists():
            data = json.loads(path.read_text())
        settings = cls(path=path, **{k: v for k, v in data.items() if k in ("token", "session_id", "tv_host")})
        if data.get("token") != settings.token or data.get("session_id") != settings.session_id:
            settings.save()
        return settings

    def save(self) -> None:
        data = asdict(self)
        data.pop("path")
        _write_json(self.path, data)


class TimerStore:
    """Timers and alarms, kept on disk so they survive a restart. Thread-safe."""

    MAX_TIMERS = 50

    def __init__(self, path: Path):
        self.path = path
        self._lock = threading.Lock()
        self._timers: list[dict] = json.loads(path.read_text()) if path.exists() else []

    def _save(self) -> None:
        _write_json(self.path, self._timers)

    def add(self, fires_at: float, label: str = "", kind: str = "timer") -> dict:
        with self._lock:
            if len(self._timers) >= self.MAX_TIMERS:
                raise ValueError("too many timers; cancel some first")
            timer = {"id": uuid.uuid4().hex[:6], "fires_at": fires_at, "label": label[:200], "kind": kind,
                     "set_at": time.time()}
            self._timers.append(timer)
            self._timers.sort(key=lambda t: t["fires_at"])
            self._save()
            return dict(timer)

    def cancel(self, timer_id: str) -> bool:
        with self._lock:
            before = len(self._timers)
            self._timers = [t for t in self._timers if t["id"] != timer_id]
            if len(self._timers) != before:
                self._save()
                return True
            return False

    def list(self) -> list[dict]:
        with self._lock:
            return [dict(t) for t in self._timers]

    def pop_due(self, now: float) -> list[dict]:
        with self._lock:
            due = [t for t in self._timers if t["fires_at"] <= now]
            if due:
                self._timers = [t for t in self._timers if t["fires_at"] > now]
                self._save()
            return due


class EventLog:
    """Recent things for the TV to do (speak, ring). The TV long-polls with ?after=<last id>."""

    KEEP = 100

    def __init__(self):
        self._items: list[dict] = []
        self.last_id = 0
        self._cond: asyncio.Condition | None = None
        self._loop: asyncio.AbstractEventLoop | None = None

    def bind(self, loop: asyncio.AbstractEventLoop) -> None:
        self._loop = loop

    def add(self, event: dict) -> dict:
        """Add an event. Safe to call from any thread once the loop is running."""
        self.last_id += 1
        item = {**event, "id": self.last_id, "at": time.time()}
        self._items = (self._items + [item])[-self.KEEP:]
        loop = self._loop
        if loop is not None and self._cond is not None:
            loop.call_soon_threadsafe(lambda: asyncio.ensure_future(self._notify()))
        return item

    async def _notify(self) -> None:
        async with self._cond:
            self._cond.notify_all()

    async def wait_after(self, after: int, timeout: float) -> list[dict]:
        if self._cond is None:
            self._cond = asyncio.Condition()
            self._loop = asyncio.get_running_loop()
        if after > self.last_id:  # the bridge restarted; start over
            after = 0
        items = [e for e in self._items if e["id"] > after]
        if items:
            return items
        try:
            async with self._cond:
                await asyncio.wait_for(self._cond.wait_for(lambda: self.last_id > after), timeout)
        except asyncio.TimeoutError:
            pass
        return [e for e in self._items if e["id"] > after]
