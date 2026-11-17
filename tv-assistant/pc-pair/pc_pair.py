"""Pair the TV's Muse identity from a Windows PC, for TVs that can't advertise over Bluetooth LE.

The PC briefly pretends to be the TV's Muse gadget: it runs Meta's pairing protocol
(vendored musegadget) over the PC's Bluetooth with `bless`, then prints one line to hand
to the TV app, which takes over the identity. The PC keeps nothing running afterwards.

    pip install bless cryptography websockets
    python pc_pair.py <state-folder>            # then Add Device in the Muse app
    python pc_pair.py <state-folder> --export   # prints the import line for the TV

Put the SDK token in <state-folder>/sdk_token first.
"""

from __future__ import annotations

import asyncio
import base64
import json
import logging
import os
import sys
import threading
import types
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "android" / "app" / "src" / "main" / "python"))
try:
    import pwd  # noqa: F401
except ImportError:
    sys.modules["pwd"] = types.ModuleType("pwd")

log = logging.getLogger("pc_pair")

SERVICE_UUID = "7fdd3d1c-38ea-46cf-8b46-314ecf5f240c"
RX_UUID = "4d593029-28a2-4a6e-a1f0-3c2d5e8f9b01"
TX_UUID = "d75dc4ca-7b2b-4e9c-8f0a-1d2e3f4a5b6c"


class BleServer:
    """musegadget's BLE Transport on top of `bless` (works on Windows, macOS and Linux)."""

    def __init__(self, local_name, on_write, on_disconnect):
        self._name = local_name
        self._on_write = on_write
        self._on_disconnect = on_disconnect
        self._loop = asyncio.new_event_loop()
        self._server = None
        self._stop = None

    def mtu(self) -> int:
        try:
            return max(23, int(getattr(self._server, "mtu", 0) or 0)) if self._server else 23
        except Exception:
            return 23

    def send_packets(self, packets):
        import time
        for i, packet in enumerate(packets):
            if i:
                time.sleep(0.05)
            fut = asyncio.run_coroutine_threadsafe(self._notify(bytes(packet)), self._loop)
            fut.result(10)

    async def _notify(self, packet: bytes):
        char = self._server.get_characteristic(TX_UUID)
        char.value = bytearray(packet)
        self._server.update_value(SERVICE_UUID, TX_UUID)

    def disconnect(self, delay: float):
        pass  # the phone disconnects by itself once pairing is done

    def run(self):
        asyncio.set_event_loop(self._loop)
        self._loop.run_until_complete(self._serve())

    async def _serve(self):
        from bless import BlessServer, GATTAttributePermissions, GATTCharacteristicProperties

        self._stop = asyncio.Event()
        server = self._server = BlessServer(name=self._name, loop=self._loop)
        server.write_request_func = lambda characteristic, value, **kw: self._handle_write(characteristic, value)
        server.read_request_func = lambda characteristic, **kw: characteristic.value
        await server.add_new_service(SERVICE_UUID)
        await server.add_new_characteristic(
            SERVICE_UUID, RX_UUID,
            GATTCharacteristicProperties.write | GATTCharacteristicProperties.write_without_response,
            None, GATTAttributePermissions.writeable)
        await server.add_new_characteristic(
            SERVICE_UUID, TX_UUID,
            GATTCharacteristicProperties.read | GATTCharacteristicProperties.notify,
            bytearray(b"\0"), GATTAttributePermissions.readable)
        await server.start()
        log.info("advertising as %s; open the Muse app > Settings > Devices > Add Device", self._name)
        await self._stop.wait()
        await server.stop()

    def _handle_write(self, characteristic, value):
        if str(characteristic.uuid).lower() == RX_UUID:
            threading.Thread(target=self._on_write, args=(bytes(value),), daemon=True).start()

    def stop(self):
        if self._stop is not None:
            self._loop.call_soon_threadsafe(self._stop.set)


def main() -> int:
    logging.basicConfig(level=logging.INFO, format="%(name)s %(levelname)s %(message)s")
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    state = Path(sys.argv[1]).resolve()
    state.mkdir(parents=True, exist_ok=True)
    os.environ["MUSEGADGET_STATE_DIR"] = str(state)
    from musegadget import config, identity

    if "--export" in sys.argv:
        bundle = {"identity": config.load_json(config.IDENTITY_FILE),
                  "pairing": config.load_json(config.PAIRING_FILE)}
        if not bundle["pairing"]:
            print("Not paired yet.")
            return 1
        print(base64.urlsafe_b64encode(json.dumps(bundle).encode()).decode())
        return 0

    sys.modules["musegadget.ble_server"] = sys.modules[__name__]
    from musegadget import pair as pair_mod
    ident = identity.load_or_create()
    print(f"Pairing as {ident.ble_name}. In the Muse app: Settings > Devices > Add Device.")
    result = pair_mod.pair(on_open=lambda w: None, force=True)
    print("Result:", result.outcome.value, result.sdk_token_problem or "")
    return 0 if result.outcome.value == "paired" else 1


if __name__ == "__main__":
    sys.exit(main())
