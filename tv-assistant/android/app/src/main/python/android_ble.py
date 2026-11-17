"""Android stand-in for musegadget.ble_server: the TV's own Bluetooth LE GATT server.

The Muse app finds the TV as "MuseGadgetXXXXXX" during pairing. The Bluetooth work is
done in Java (BlePeripheral); this class gives the SDK the Transport it expects.
"""

from __future__ import annotations

import logging
import threading
import time
from typing import Callable

from java import dynamic_proxy, jclass

from musegadget.ble_framing import CHUNK_STAGGER_S, MAX_PACKET_BYTES

log = logging.getLogger(__name__)

SERVICE_UUID = "7fdd3d1c-38ea-46cf-8b46-314ecf5f240c"
RX_UUID = "4d593029-28a2-4a6e-a1f0-3c2d5e8f9b01"
TX_UUID = "d75dc4ca-7b2b-4e9c-8f0a-1d2e3f4a5b6c"
PAIRED_FLAG_COMPANY_ID = 0xFFFF
_ASSUMED_MTU = MAX_PACKET_BYTES + 3

LAST_ERROR = ""

_Listener = jclass("com.adamk.tvassistant.BlePeripheral$Listener")


class BleServer:
    context = None  # set by tvgadget before pairing

    def __init__(self, local_name: str, on_write: Callable[[bytes], None], on_disconnect: Callable[[], None]):
        self._local_name = local_name
        self._on_write = on_write
        self._on_disconnect = on_disconnect
        self._mtu = _ASSUMED_MTU
        self._lock = threading.Lock()
        self._stopped = threading.Event()
        self._error: str | None = None
        server = self

        class Listener(dynamic_proxy(_Listener)):
            def onWrite(self, value, mtu):
                with server._lock:
                    server._mtu = int(mtu)
                server._on_write(bytes(value))

            def onDisconnect(self):
                with server._lock:
                    server._mtu = _ASSUMED_MTU
                server._on_disconnect()

            def onFailed(self, reason):
                global LAST_ERROR
                server._error = LAST_ERROR = str(reason)
                log.error("Bluetooth setup failed: %s", reason)
                server._stopped.set()

        self._listener = Listener()
        self._peripheral = jclass("com.adamk.tvassistant.BlePeripheral")(
            BleServer.context, local_name, SERVICE_UUID, RX_UUID, TX_UUID, PAIRED_FLAG_COMPANY_ID, self._listener)

    @property
    def error(self) -> str | None:
        return self._error

    # -- Transport ------------------------------------------------------------
    def mtu(self) -> int:
        with self._lock:
            return self._mtu

    def send_packets(self, packets: list[bytes]) -> None:
        for i, packet in enumerate(packets):
            if i:
                time.sleep(CHUNK_STAGGER_S)
            self._peripheral.notifyTx(bytes(packet))

    def disconnect(self, delay: float) -> None:
        threading.Timer(delay, self._peripheral.disconnect).start()

    # -- Lifecycle ------------------------------------------------------------
    def run(self) -> None:
        self._peripheral.start()
        try:
            self._stopped.wait()
        finally:
            self._peripheral.stop()

    def stop(self) -> None:
        self._stopped.set()
