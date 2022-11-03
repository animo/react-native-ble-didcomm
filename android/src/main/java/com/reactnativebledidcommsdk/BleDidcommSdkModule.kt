package com.reactnativebledidcommsdk

import android.annotation.SuppressLint
import android.bluetooth.*
import android.bluetooth.le.AdvertiseCallback
import android.bluetooth.le.ScanCallback
import android.bluetooth.le.ScanResult
import androidx.annotation.RequiresPermission
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.reactnativebledidcommsdk.central.CentralManager
import com.reactnativebledidcommsdk.peripheral.PeripheralManager
import java.util.*


class BleDidcommSdkModule(private val context: ReactApplicationContext) :
    ReactContextBaseJavaModule(context) {
    private val centralManager: CentralManager = CentralManager(context)
    private val peripheralManager: PeripheralManager = PeripheralManager(context)

    override fun getName(): String {
        return Constants.TAG
    }

    @ReactMethod
    @RequiresPermission(value = "android.permission.BLUETOOTH_CONNECT")
    fun start(
        serviceUUID: String,
        characteristicUUID: String,
        notifyCharacteristicUUID: String,
        promise: Promise
    ) {
        try {
            peripheralManager.setupServer(GattServerCallback())
            centralManager.initialize(
                UUID.fromString(serviceUUID),
                UUID.fromString(characteristicUUID),
                UUID.fromString(notifyCharacteristicUUID)
            )
            peripheralManager.initialize(
                UUID.fromString(serviceUUID),
                UUID.fromString(characteristicUUID),
                UUID.fromString(notifyCharacteristicUUID)
            )
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("error", e)
        }
    }

    @ReactMethod
    @RequiresPermission(value = "android.permission.BLUETOOTH_SCAN")
    fun scan(options: ReadableMap, promise: Promise) {
        try {
            this.centralManager.scan(BluetoothScanCallback())
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("error", e)
        }
    }

    @ReactMethod
    @RequiresPermission(value = "android.permission.BLUETOOTH_ADVERTISE")
    fun advertise(options: ReadableMap, promise: Promise) {
        try {
            this.peripheralManager.advertise(DeviceAdvertiseCallback())
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("error", e)
        }
    }

    @ReactMethod
    @RequiresPermission(allOf = ["android.permission.BLUETOOTH_CONNECT", "android.permission.BLUETOOTH_SCAN"])
    fun connect(peripheralId: String, promise: Promise) {
        try {
            this.centralManager.connect(peripheralId, GattClientCallback())
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("error", e)
        }
    }

    @ReactMethod
    @RequiresPermission(value = "android.permission.BLUETOOTH_CONNECT")
    fun write(peripheralId: String, message: String, promise: Promise) {
        try {
            this.centralManager.write(message.toByteArray(Charsets.UTF_8))
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("error", e)
        }
    }

    @ReactMethod
    @RequiresPermission(value = "android.permission.BLUETOOTH_CONNECT")
    fun notify(message: String, promise: Promise) {
        try {
            this.peripheralManager.notify(message.toByteArray(Charsets.UTF_8))
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("error", e)
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {
    }

    @ReactMethod
    fun removeListeners(count: Int) {
    }

    private fun sendEvent(event: BleDidcommEvent, params: WritableMap?) {
        this.context
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(event.token, params)
    }

    private inner class GattClientCallback : BluetoothGattCallback() {
        var message: ByteArray = byteArrayOf()

        override fun onCharacteristicChanged(
            gatt: BluetoothGatt,
            characteristic: BluetoothGattCharacteristic
        ) {
            super.onCharacteristicChanged(gatt, characteristic)
            val msg = characteristic.value
            if (msg.toString(Charsets.UTF_8) == "EOM") {
                val params = Arguments.createMap().apply {
                    putString("message", message.toString(Charsets.UTF_8))
                }
                sendEvent(BleDidcommEvent.OnReceivedNotification, params)
                message = byteArrayOf()
            } else {
                message += msg
            }
        }

        override fun onCharacteristicWrite(
            gatt: BluetoothGatt,
            characteristic: BluetoothGattCharacteristic,
            status: Int
        ) {
            super.onCharacteristicWrite(gatt, characteristic, status)

            if (status == BluetoothGatt.GATT_SUCCESS) {
                centralManager.isPeripheralReady = true
            }
        }

        @SuppressLint("MissingPermission")
        override fun onServicesDiscovered(gatt: BluetoothGatt, status: Int) {
            super.onServicesDiscovered(gatt, status)
            val service = gatt.getService(centralManager.serviceUUID)
            centralManager.characteristic =
                service.getCharacteristic(centralManager.characteristicUUID)
            val notifyCharacteristic =
                service.getCharacteristic(centralManager.notifyCharacteristicUUID)
            gatt.setCharacteristicNotification(notifyCharacteristic, true)
        }

        @SuppressLint("MissingPermission")
        override fun onConnectionStateChange(gatt: BluetoothGatt, status: Int, newState: Int) {
            super.onConnectionStateChange(gatt, status, newState)
            if (newState == BluetoothProfile.STATE_CONNECTED) {
                val params = Arguments.createMap().apply {
                    putString("peripheralId", gatt.device.address)
                }
                sendEvent(BleDidcommEvent.OnConnectedPeripheral, params)
                gatt.discoverServices()
                centralManager.stopScan()
            } else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
                centralManager.connectedPeripheral = null
            }
        }
    }

    private inner class BluetoothScanCallback : ScanCallback() {
        override fun onScanResult(callbackType: Int, result: ScanResult?) {
            super.onScanResult(callbackType, result)
            super.onScanResult(callbackType, result)
            val device = result?.device ?: return
            centralManager.discoveredPeripherals.add(device)
            val params = Arguments.createMap().apply {
                putString("peripheralId", device.address)
            }
            sendEvent(BleDidcommEvent.OnDiscoverPeripheral, params)
        }
    }

    private inner class GattServerCallback : BluetoothGattServerCallback() {
        var message: ByteArray = byteArrayOf()

        @SuppressLint("MissingPermission")
        override fun onCharacteristicWriteRequest(
            device: BluetoothDevice,
            requestId: Int,
            characteristic: BluetoothGattCharacteristic?,
            preparedWrite: Boolean,
            responseNeeded: Boolean,
            offset: Int,
            value: ByteArray
        ) {
            super.onCharacteristicWriteRequest(
                device,
                requestId,
                characteristic,
                preparedWrite,
                responseNeeded,
                offset,
                value
            )

            if ("EOM" == value.toString(Charsets.UTF_8)) {
                val params = Arguments.createMap().apply {
                    putString("message", message.toString(Charsets.UTF_8))
                }
                sendEvent(BleDidcommEvent.OnReceivedWriteWithoutResponse, params)
                message = byteArrayOf()
            } else {
                message += value
            }

            if (responseNeeded) {
                peripheralManager.gattServer?.sendResponse(
                    device,
                    requestId,
                    BluetoothGatt.GATT_SUCCESS,
                    offset,
                    value
                )
            }
        }

        override fun onNotificationSent(device: BluetoothDevice?, status: Int) {
            super.onNotificationSent(device, status)
            if(status === BluetoothGatt.GATT_SUCCESS) {
                peripheralManager.isConnectedClientReady = true
            }
        }

        @SuppressLint("MissingPermission")
        override fun onExecuteWrite(device: BluetoothDevice?, requestId: Int, execute: Boolean) {
            super.onExecuteWrite(device, requestId, execute)
            peripheralManager.gattServer?.sendResponse(
                device,
                requestId,
                BluetoothGatt.GATT_SUCCESS,
                0,
                null
            )
        }

        override fun onConnectionStateChange(device: BluetoothDevice, status: Int, newState: Int) {
            super.onConnectionStateChange(device, status, newState)
            if (newState == BluetoothProfile.STATE_CONNECTED) {
                peripheralManager.connectedClient = device
            } else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
                peripheralManager.connectedClient = null
            }
        }
    }

    private inner class DeviceAdvertiseCallback : AdvertiseCallback()
}
