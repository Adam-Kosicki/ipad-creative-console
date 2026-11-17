package com.adamk.tvassistant;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothGatt;
import android.bluetooth.BluetoothGattCharacteristic;
import android.bluetooth.BluetoothGattDescriptor;
import android.bluetooth.BluetoothGattServer;
import android.bluetooth.BluetoothGattServerCallback;
import android.bluetooth.BluetoothGattService;
import android.bluetooth.BluetoothManager;
import android.bluetooth.BluetoothProfile;
import android.bluetooth.le.AdvertiseCallback;
import android.bluetooth.le.AdvertiseData;
import android.bluetooth.le.AdvertiseSettings;
import android.bluetooth.le.BluetoothLeAdvertiser;
import android.content.Context;
import android.os.ParcelUuid;
import android.util.Log;

import java.util.UUID;

/**
 * The TV as a Bluetooth LE peripheral for Muse pairing: advertises the Muse gadget setup
 * service, receives the phone's writes on RX and notifies replies on TX. Driven from Python
 * (android_ble.py), which runs Meta's pairing protocol on top.
 */
public class BlePeripheral {
    public interface Listener {
        void onWrite(byte[] value, int mtu);
        void onDisconnect();
        void onFailed(String reason);
    }

    private static final String TAG = "TvAssistantBle";
    private static final UUID CCCD = UUID.fromString("00002902-0000-1000-8000-00805f9b34fb");

    private final Context context;
    private final String name;
    private final UUID serviceUuid, rxUuid, txUuid;
    private final int companyId;
    private final Listener listener;
    private BluetoothManager manager;
    private BluetoothAdapter adapter;
    private BluetoothLeAdvertiser advertiser;
    private BluetoothGattServer server;
    private BluetoothGattCharacteristic tx;
    private volatile BluetoothDevice device;
    private volatile int mtu = 163;
    private String savedName;

    public BlePeripheral(Context context, String name, String service, String rx, String txc, int companyId, Listener listener) {
        this.context = context.getApplicationContext();
        this.name = name;
        this.serviceUuid = UUID.fromString(service);
        this.rxUuid = UUID.fromString(rx);
        this.txUuid = UUID.fromString(txc);
        this.companyId = companyId;
        this.listener = listener;
    }

    /** Diagnostic for the status screen: can this TV advertise as a peripheral at all? */
    public static String support(Context c) {
        BluetoothManager m = (BluetoothManager) c.getSystemService(Context.BLUETOOTH_SERVICE);
        BluetoothAdapter a = m == null ? null : m.getAdapter();
        if (a == null) return "no Bluetooth";
        if (!a.isEnabled()) return "Bluetooth is off";
        return a.isMultipleAdvertisementSupported() && a.getBluetoothLeAdvertiser() != null
                ? "can pair" : "this TV can't advertise over Bluetooth LE";
    }

    @SuppressWarnings("MissingPermission")
    public void start() {
        manager = (BluetoothManager) context.getSystemService(Context.BLUETOOTH_SERVICE);
        adapter = manager == null ? null : manager.getAdapter();
        if (adapter == null || !adapter.isEnabled()) { listener.onFailed("Bluetooth is off"); return; }
        advertiser = adapter.getBluetoothLeAdvertiser();
        if (advertiser == null) { listener.onFailed("this TV can't advertise over Bluetooth LE"); return; }

        server = manager.openGattServer(context, callback);
        if (server == null) { listener.onFailed("could not open a GATT server"); return; }
        BluetoothGattService service = new BluetoothGattService(serviceUuid, BluetoothGattService.SERVICE_TYPE_PRIMARY);
        BluetoothGattCharacteristic rx = new BluetoothGattCharacteristic(rxUuid,
                BluetoothGattCharacteristic.PROPERTY_WRITE | BluetoothGattCharacteristic.PROPERTY_WRITE_NO_RESPONSE,
                BluetoothGattCharacteristic.PERMISSION_WRITE);
        tx = new BluetoothGattCharacteristic(txUuid,
                BluetoothGattCharacteristic.PROPERTY_READ | BluetoothGattCharacteristic.PROPERTY_NOTIFY,
                BluetoothGattCharacteristic.PERMISSION_READ);
        tx.addDescriptor(new BluetoothGattDescriptor(CCCD,
                BluetoothGattDescriptor.PERMISSION_READ | BluetoothGattDescriptor.PERMISSION_WRITE));
        service.addCharacteristic(rx);
        service.addCharacteristic(tx);
        server.addService(service);

        // The phone also reads the GAP name, so the adapter takes the gadget's name while pairing.
        savedName = adapter.getName();
        adapter.setName(name);

        AdvertiseSettings settings = new AdvertiseSettings.Builder()
                .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
                .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_HIGH)
                .setConnectable(true)
                .setTimeout(0)
                .build();
        AdvertiseData data = new AdvertiseData.Builder()
                .addServiceUuid(new ParcelUuid(serviceUuid))
                .addManufacturerData(companyId, new byte[]{0})
                .setIncludeDeviceName(false)
                .build();
        AdvertiseData scan = new AdvertiseData.Builder().setIncludeDeviceName(true).build();
        advertiser.startAdvertising(settings, data, scan, advertiseCallback);
    }

    private final AdvertiseCallback advertiseCallback = new AdvertiseCallback() {
        @Override public void onStartSuccess(AdvertiseSettings s) { Log.i(TAG, "advertising as " + name); }
        @Override public void onStartFailure(int code) { listener.onFailed("advertising failed (code " + code + ")"); }
    };

    @SuppressWarnings("MissingPermission")
    public void notifyTx(byte[] packet) {
        BluetoothDevice d = device;
        if (d == null || server == null) return;
        tx.setValue(packet);
        server.notifyCharacteristicChanged(d, tx, false);
    }

    @SuppressWarnings("MissingPermission")
    public void disconnect() {
        BluetoothDevice d = device;
        if (d != null && server != null) server.cancelConnection(d);
    }

    @SuppressWarnings("MissingPermission")
    public void stop() {
        try { if (advertiser != null) advertiser.stopAdvertising(advertiseCallback); } catch (Exception ignored) { }
        try { if (server != null) server.close(); } catch (Exception ignored) { }
        try { if (adapter != null && savedName != null) adapter.setName(savedName); } catch (Exception ignored) { }
        server = null;
    }

    private final BluetoothGattServerCallback callback = new BluetoothGattServerCallback() {
        @Override
        public void onConnectionStateChange(BluetoothDevice d, int status, int newState) {
            Log.i(TAG, "device " + d + " state " + newState);
            if (newState == BluetoothProfile.STATE_CONNECTED) {
                device = d;
            } else if (newState == BluetoothProfile.STATE_DISCONNECTED && d.equals(device)) {
                device = null;
                mtu = 163;
                listener.onDisconnect();
            }
        }

        @Override
        public void onMtuChanged(BluetoothDevice d, int newMtu) { mtu = newMtu; Log.i(TAG, "MTU " + newMtu); }

        @Override
        @SuppressWarnings("MissingPermission")
        public void onCharacteristicWriteRequest(BluetoothDevice d, int requestId, BluetoothGattCharacteristic c,
                                                 boolean prepared, boolean responseNeeded, int offset, byte[] value) {
            if (responseNeeded) server.sendResponse(d, requestId, BluetoothGatt.GATT_SUCCESS, 0, null);
            if (rxUuid.equals(c.getUuid()) && value != null) {
                device = d;
                listener.onWrite(value, mtu);
            }
        }

        @Override
        @SuppressWarnings("MissingPermission")
        public void onDescriptorWriteRequest(BluetoothDevice d, int requestId, BluetoothGattDescriptor desc,
                                             boolean prepared, boolean responseNeeded, int offset, byte[] value) {
            device = d;
            if (responseNeeded) server.sendResponse(d, requestId, BluetoothGatt.GATT_SUCCESS, 0, null);
        }

        @Override
        @SuppressWarnings("MissingPermission")
        public void onCharacteristicReadRequest(BluetoothDevice d, int requestId, int offset, BluetoothGattCharacteristic c) {
            server.sendResponse(d, requestId, BluetoothGatt.GATT_SUCCESS, 0, new byte[0]);
        }

        @Override
        @SuppressWarnings("MissingPermission")
        public void onDescriptorReadRequest(BluetoothDevice d, int requestId, int offset, BluetoothGattDescriptor desc) {
            server.sendResponse(d, requestId, BluetoothGatt.GATT_SUCCESS, 0, BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE);
        }
    };
}
