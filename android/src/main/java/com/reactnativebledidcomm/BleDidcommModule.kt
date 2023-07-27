package com.reactnativebledidcomm

import android.annotation.SuppressLint
import android.bluetooth.*
import android.bluetooth.le.AdvertiseCallback
import android.bluetooth.le.ScanCallback
import android.bluetooth.le.ScanResult
import android.util.Log
import androidx.annotation.RequiresPermission
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.reactnativebledidcomm.central.CentralManager
import com.reactnativebledidcomm.central.CentralManagerException
import com.reactnativebledidcomm.peripheral.PeripheralManager
import com.reactnativebledidcomm.peripheral.PeripheralManagerException
import java.util.*


class BleDidcommModule(private val context: ReactApplicationContext) :
    ReactContextBaseJavaModule(context) {
    private var centralManager: CentralManager? = null
    private var peripheralManager: PeripheralManager? = null

    override fun getName(): String {
        return Constants.TAG
    }

    @ReactMethod
    fun startCentral(
        @Suppress("UNUSED_PARAMETER") options: ReadableMap,
        promise: Promise
    ) {
        try {
            this.centralManager = CentralManager(context)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("error", e)
        }
    }

    @ReactMethod
    @RequiresPermission(value = "android.permission.BLUETOOTH_CONNECT")
    fun startPeripheral(
        @Suppress("UNUSED_PARAMETER") options: ReadableMap,
        promise: Promise
    ) {
        try {
            this.peripheralManager = PeripheralManager(context, gattServerCallback)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("error", e)
        }
    }

    @ReactMethod
    fun shutdownCentral(
        @Suppress("UNUSED_PARAMETER") options: ReadableMap,
        promise: Promise
    ) {
        try {
            this.centralManager?.shutdownCentral()
            this.centralManager = null
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("error", e)
        }
    }

    @ReactMethod
    fun shutdownPeripheral(
        @Suppress("UNUSED_PARAMETER") options: ReadableMap,
        promise: Promise
    ) {
        try {
            this.peripheralManager?.shutdownPeripheral()
            this.peripheralManager = null
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("error", e)
        }
    }

    @ReactMethod
    fun setCentralService(
        serviceUUID: String,
        writeCharacteristicUUID: String,
        indicationCharacteristicUUID: String,
        promise: Promise
    ) {
        try {
            val centralManager =
                this.centralManager ?: throw CentralManagerException.NotStarted()
            centralManager.setService(
                UUID.fromString(serviceUUID),
                UUID.fromString(writeCharacteristicUUID),
                UUID.fromString(indicationCharacteristicUUID)
            )
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("error", e)
        }
    }

    @ReactMethod
    fun setPeripheralService(
        serviceUUID: String,
        writeCharacteristicUUID: String,
        indicationCharacteristicUUID: String,
        promise: Promise
    ) {
        try {
            val peripheralManager =
                this.peripheralManager ?: throw PeripheralManagerException.NotStarted()
            peripheralManager.setService(
                UUID.fromString(serviceUUID),
                UUID.fromString(writeCharacteristicUUID),
                UUID.fromString(indicationCharacteristicUUID)
            )
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("error", e)
        }
    }

    @ReactMethod
    @RequiresPermission(value = "android.permission.BLUETOOTH_SCAN")
    fun scan(@Suppress("UNUSED_PARAMETER") options: ReadableMap, promise: Promise) {
        try {
            val centralManager =
                this.centralManager ?: throw CentralManagerException.NotStarted()
            centralManager.scan(bluetoothScanCallback)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("error", e)
        }
    }

    @ReactMethod
    @RequiresPermission(value = "android.permission.BLUETOOTH_ADVERTISE")
    fun advertise(@Suppress("UNUSED_PARAMETER") options: ReadableMap, promise: Promise) {
        try {
            val peripheralManager =
                this.peripheralManager ?: throw PeripheralManagerException.NotStarted()
            peripheralManager.advertise(deviceAdvertiseCallback)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("error", e)
        }
    }

    @ReactMethod
    @RequiresPermission(allOf = ["android.permission.BLUETOOTH_CONNECT", "android.permission.BLUETOOTH_SCAN"])
    fun connect(peripheralId: String, promise: Promise) {
        try {
            val centralManager =
                this.centralManager ?: throw CentralManagerException.NotStarted()
            centralManager.connect(peripheralId, gattClientCallback)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("error", e)
        }
    }

    @ReactMethod
    @RequiresPermission(value = "android.permission.BLUETOOTH_CONNECT")
    fun write(message: String, promise: Promise) {
        try {
            val centralManager =
                this.centralManager ?: throw CentralManagerException.NotStarted()
            centralManager.write(message.toByteArray(Charsets.UTF_8))
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("error", e)
        }
    }

    @ReactMethod
    @RequiresPermission(value = "android.permission.BLUETOOTH_CONNECT")
    fun indicate(message: String, promise: Promise) {
        try {
            val peripheralManager =
                this.peripheralManager ?: throw PeripheralManagerException.NotStarted()
            peripheralManager.indicate(message.toByteArray(Charsets.UTF_8))
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("error", e)
        }
    }


    @ReactMethod
    fun addListener(@Suppress("UNUSED_PARAMETER") eventName: String) {
    }


    @ReactMethod
    fun removeListeners(@Suppress("UNUSED_PARAMETER") count: Int) {
    }

    private fun sendEvent(event: BleDidcommEvent, params: WritableMap?) {
        this.context
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(event.token, params)
    }

    private val gattClientCallback = object : BluetoothGattCallback() {
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
                centralManager?.isPeripheralReady = true
            }
        }

        @SuppressLint("MissingPermission")
        override fun onMtuChanged(gatt: BluetoothGatt?, mtu: Int, status: Int) {
            super.onMtuChanged(gatt, mtu, status)
            if (status != BluetoothGatt.GATT_SUCCESS) {
                Log.e(Constants.TAG, "error occurred while requesting MTU. Status $status")
                return
            }
            centralManager?.connectedMtu = mtu
            val descriptor =
                centralManager?.indicationCharacteristic?.getDescriptor(UUID.fromString(Constants.CCC_DESCRIPTOR_UUID))
            descriptor?.value = BluetoothGattDescriptor.ENABLE_INDICATION_VALUE
            gatt?.writeDescriptor(descriptor)
        }

        @SuppressLint("MissingPermission")
        override fun onServicesDiscovered(gatt: BluetoothGatt, status: Int) {
            super.onServicesDiscovered(gatt, status)
            val service = gatt.getService(centralManager?.serviceUUID)
            centralManager?.writeCharacteristic =
                service.getCharacteristic(centralManager?.writeCharacteristicUUID)
            centralManager?.indicationCharacteristic =
                service.getCharacteristic(centralManager?.indicationCharacteristicUUID)
            gatt.setCharacteristicNotification(centralManager?.indicationCharacteristic, true)
            gatt.requestMtu(512)
        }

        @SuppressLint("MissingPermission")
        override fun onConnectionStateChange(gatt: BluetoothGatt, status: Int, newState: Int) {
            super.onConnectionStateChange(gatt, status, newState)
            val params = Arguments.createMap().apply {
                putString("identifier", gatt.device.address)
            }
            if (newState == BluetoothProfile.STATE_CONNECTED) {
                sendEvent(BleDidcommEvent.OnConnectedPeripheral, params)
                gatt.discoverServices()
                centralManager?.stopScan()
            } else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
                sendEvent(BleDidcommEvent.OnDisconnectedPeripheral, params)
                centralManager?.connectedPeripheral = null
            }
        }
    }

    private val bluetoothScanCallback = object : ScanCallback() {
        override fun onScanResult(callbackType: Int, result: ScanResult?) {
            super.onScanResult(callbackType, result)
            val device = result?.device ?: return
            centralManager?.discoveredPeripherals?.add(device)
            val params = Arguments.createMap().apply {
                putString("identifier", device.address)
            }
            sendEvent(BleDidcommEvent.OnDiscoverPeripheral, params)
        }
    }

    private val gattServerCallback = object : BluetoothGattServerCallback() {
        var message: ByteArray = byteArrayOf()

        override fun onMtuChanged(device: BluetoothDevice?, mtu: Int) {
            super.onMtuChanged(device, mtu)
            peripheralManager?.connectedMtu = mtu
        }

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
                peripheralManager?.gattServer?.sendResponse(
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
            if (status == BluetoothGatt.GATT_SUCCESS) {
                peripheralManager?.isConnectedClientReady = true
            }
        }

        @SuppressLint("MissingPermission")
        override fun onExecuteWrite(device: BluetoothDevice?, requestId: Int, execute: Boolean) {
            super.onExecuteWrite(device, requestId, execute)
            peripheralManager?.gattServer?.sendResponse(
                device,
                requestId,
                BluetoothGatt.GATT_SUCCESS,
                0,
                null
            )
        }

        @SuppressLint("MissingPermission")
        override fun onConnectionStateChange(device: BluetoothDevice, status: Int, newState: Int) {
            super.onConnectionStateChange(device, status, newState)
            val params = Arguments.createMap().apply {
                putString("identifier", device.address)
            }
            if (newState == BluetoothProfile.STATE_CONNECTED) {
                peripheralManager?.connectedClient = device
                sendEvent(BleDidcommEvent.OnConnectedCentral, params)
            } else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
                sendEvent(BleDidcommEvent.OnDisconnectedCentral, params)
                peripheralManager?.connectedClient = null
            }
        }
    }

    private val deviceAdvertiseCallback = object : AdvertiseCallback()
}
