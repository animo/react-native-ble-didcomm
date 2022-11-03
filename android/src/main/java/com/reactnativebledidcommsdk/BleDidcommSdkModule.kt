package com.reactnativebledidcommsdk

import android.Manifest
import android.annotation.SuppressLint
import android.bluetooth.*
import android.bluetooth.le.AdvertiseCallback
import android.bluetooth.le.ScanCallback
import android.bluetooth.le.ScanResult
import android.content.pm.PackageManager
import android.util.Log
import androidx.annotation.RequiresPermission
import androidx.core.app.ActivityCompat
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.reactnativebledidcommsdk.central.CentralManager
import com.reactnativebledidcommsdk.peripheral.PeripheralManager
import java.util.*


class BleDidcommSdkModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    private val centralManager: CentralManager = CentralManager(context)
    private val peripheralManager: PeripheralManager = PeripheralManager(context)

    override fun getName(): String {
        return Constants.TAG
    }

    @ReactMethod
    @RequiresPermission(value = "android.permission.BLUETOOTH_CONNECT")
    fun start(options: ReadableMap, promise: Promise) {
        try {
            this.peripheralManager.setupServer(GattServerCallback())
            Log.d(Constants.TAG, "Initialized the peripheral Server")
            promise.resolve(null)
        }catch(e: Exception) {
            promise.reject("error", e)
        }
    }

    @ReactMethod
    @RequiresPermission(value = "android.permission.BLUETOOTH_SCAN")
    fun scan(serviceUUID: String, characteristicUUID: String, promise: Promise) {
        try {
            this.centralManager.scan(
                    UUID.fromString(serviceUUID),
                    UUID.fromString(characteristicUUID),
                    BluetoothScanCallback()
            )
            Log.d(Constants.TAG, "Started scanning...")
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
            Log.d(Constants.TAG, "Started advertising...")
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("error", e)
        }
    }

    @ReactMethod
    @RequiresPermission(value = "android.permission.BLUETOOTH_CONNECT")
    fun preparePeripheral(serviceUUID: String, characteristicUUID: String, promise: Promise) {
        try {
            peripheralManager.setupServiceAndCharacteristic(UUID.fromString(serviceUUID), UUID.fromString(characteristicUUID))
            Log.d(Constants.TAG, "Setting up the service and characteristic...")
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

            Log.d(Constants.TAG, "Connecting to peripheral $peripheralId...")
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
            Log.d(Constants.TAG, "Written $message to $peripheralId...")
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
            Log.d(Constants.TAG, "Notifying $message...")
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("error", e)
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}

    private fun sendEvent(event: BleDidcommEvent, params: WritableMap?) {
        this.context
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(event.token, params)
    }

    private inner class GattClientCallback : BluetoothGattCallback() {
        var message: String? = null

        override fun onCharacteristicChanged(gatt: BluetoothGatt, characteristic: BluetoothGattCharacteristic) {
            super.onCharacteristicChanged(gatt, characteristic)
            Log.d(Constants.TAG, "[CLIENT]: onCharacteristicChanged called!")
            val msg = String(characteristic.value, Charsets.UTF_8)
            if(msg == "EOM") {
                val params = Arguments.createMap().apply {
                    putString("message", message)
                }
                sendEvent(BleDidcommEvent.OnReceivedNotification, params)
                message = null
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
                Log.d(Constants.TAG, "IS READY")
                centralManager.isPeripheralReady = true
            }
        }

        override fun onMtuChanged(gatt: BluetoothGatt, mtu: Int, status: Int) {
            super.onMtuChanged(gatt, mtu, status)
            Log.d(Constants.TAG, "[MTU]: $mtu")
            centralManager.connectedMtu = mtu
        }


        @SuppressLint("MissingPermission")
        override fun onServicesDiscovered(gatt: BluetoothGatt, status: Int) {
            super.onServicesDiscovered(gatt, status)
            Log.d(Constants.TAG, "[CLIENT]: onServicesDiscovered called!")
            val service = gatt.getService(centralManager.serviceUUID)
            centralManager.characteristic = service.getCharacteristic(centralManager.characteristicUUID)
            gatt.setCharacteristicNotification(centralManager.characteristic, true)
        }

        @SuppressLint("MissingPermission")
        override fun onConnectionStateChange(gatt: BluetoothGatt, status: Int, newState: Int) {
            super.onConnectionStateChange(gatt, status, newState)
            Log.d(Constants.TAG, "[CLIENT]: onConnectionStateChange called! NEW STATE: $newState")
            if (newState == BluetoothProfile.STATE_CONNECTED) {
                val params = Arguments.createMap().apply {
                    putString("peripheralId", gatt.device.address)
                }
                sendEvent(BleDidcommEvent.OnConnectedPeripheral, params)
                gatt.discoverServices()
//                gatt.requestMtu(512)
                centralManager.stopScan()
            } else if(newState == BluetoothProfile.STATE_DISCONNECTED) {
                centralManager.connectedPeripheral = null
            }
        }
    }

    private inner class BluetoothScanCallback : ScanCallback() {
        override fun onScanResult(callbackType: Int, result: ScanResult?) {
            super.onScanResult(callbackType, result)
            Log.d(Constants.TAG, "[CLIENT]: onScanResult called!")
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

        override fun onMtuChanged(device: BluetoothDevice, mtu: Int) {
            super.onMtuChanged(device, mtu)
            peripheralManager.connectedMtu = mtu
        }

        @SuppressLint("MissingPermission")
        override fun onCharacteristicWriteRequest(device: BluetoothDevice, requestId: Int, characteristic: BluetoothGattCharacteristic?, preparedWrite: Boolean, responseNeeded: Boolean, offset: Int, value: ByteArray) {
            super.onCharacteristicWriteRequest(device, requestId, characteristic, preparedWrite, responseNeeded, offset, value)
            Log.d(Constants.TAG, "[SERVER]: onCharacteristicWriteRequest called!")

            if("EOM" == value.toString(Charsets.UTF_8)) {
                val params = Arguments.createMap().apply {
                    putString("message", message.toString(Charsets.UTF_8))
                }
                sendEvent(BleDidcommEvent.OnReceivedWriteWithoutResponse, params)
                message = byteArrayOf()
            } else {
                message += value
            }

            if(responseNeeded) {
                peripheralManager.gattServer?.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, offset, value)
            }
        }

        @SuppressLint("MissingPermission")
        override fun onExecuteWrite(device: BluetoothDevice?, requestId: Int, execute: Boolean) {
            super.onExecuteWrite(device, requestId, execute)
            peripheralManager.gattServer?.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, 0, null)
        }

        override fun onConnectionStateChange(device: BluetoothDevice, status: Int, newState: Int) {
            Log.d(Constants.TAG, "[SERVER]: onConnectionStateChanged called")
            super.onConnectionStateChange(device, status, newState)
            if(newState == BluetoothProfile.STATE_CONNECTED) {
                peripheralManager.connectedClient = device
            } else if(newState == BluetoothProfile.STATE_DISCONNECTED) {
                peripheralManager.connectedClient = null
            }
        }
    }

    private inner class DeviceAdvertiseCallback : AdvertiseCallback()
}
