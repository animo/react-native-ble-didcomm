package com.reactnativebledidcomm.peripheral

import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothGatt
import android.bluetooth.BluetoothGattCharacteristic
import android.bluetooth.BluetoothGattDescriptor
import android.bluetooth.BluetoothGattServer
import android.bluetooth.BluetoothGattServerCallback
import android.bluetooth.BluetoothGattService
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothProfile
import android.bluetooth.le.AdvertiseCallback
import android.bluetooth.le.AdvertiseData
import android.bluetooth.le.AdvertiseSettings
import android.content.Context
import android.os.ParcelUuid
import android.util.Log
import androidx.annotation.RequiresPermission
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.reactnativebledidcomm.BleDidcommEvent
import com.reactnativebledidcomm.Constants
import java.util.Arrays
import java.util.UUID

class PeripheralManager(private val context: ReactContext) {
    private fun sendEvent(event: BleDidcommEvent, params: WritableMap?) {
        context
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(event.token, params)
    }

    private val bluetoothManager: BluetoothManager by lazy {
        context.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
    }

    private val bluetoothAdapter: BluetoothAdapter by lazy {
        bluetoothManager.adapter
    }

    private val bleAdvertiser by lazy {
        bluetoothAdapter.bluetoothLeAdvertiser
    }

    private var writeCharacteristic: BluetoothGattCharacteristic? = null
    private var indicationCharacteristic: BluetoothGattCharacteristic? = null
    private var service: BluetoothGattService? = null

    var connectedClient: BluetoothDevice? = null
    var connectedMtu: Int = 20
    var isConnectedClientReady: Boolean = true

    private var advertiseCallback: AdvertiseCallback = object : AdvertiseCallback() {}

    private var isSending: Boolean = false

    private val advertiseSettings = AdvertiseSettings.Builder()
        .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_BALANCED)
        .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_MEDIUM)
        .setConnectable(true)
        .build()

    @SuppressLint("MissingPermission")
    fun setService(
        serviceUUID: UUID,
        writeCharacteristicUUID: UUID,
        indicationCharacteristicUUID: UUID,
    ) {
        writeCharacteristic = BluetoothGattCharacteristic(
            writeCharacteristicUUID,
            BluetoothGattCharacteristic.PROPERTY_WRITE,
            BluetoothGattCharacteristic.PERMISSION_WRITE,
        )
        indicationCharacteristic = BluetoothGattCharacteristic(
            indicationCharacteristicUUID,
            BluetoothGattCharacteristic.PROPERTY_INDICATE,
            BluetoothGattCharacteristic.PERMISSION_WRITE,
        )
        val descriptor = BluetoothGattDescriptor(
            UUID.fromString(Constants.CCC_DESCRIPTOR_UUID),
            BluetoothGattDescriptor.PERMISSION_WRITE or BluetoothGattCharacteristic.PERMISSION_READ,
        )
        indicationCharacteristic?.addDescriptor(descriptor)
        service =
            BluetoothGattService(serviceUUID, BluetoothGattService.SERVICE_TYPE_PRIMARY).apply {
                addCharacteristic(writeCharacteristic)
                addCharacteristic(indicationCharacteristic)
            }

        gattServer.addService(service)
    }

    @SuppressLint("MissingPermission")
    fun shutdownPeripheral() {
        gattServer.clearServices()
        if (connectedClient != null) {
            gattServer.cancelConnection(connectedClient)
        }

        gattServer.close()

        connectedClient = null

        writeCharacteristic = null
        indicationCharacteristic = null
        service = null
    }

    @RequiresPermission(value = "android.permission.BLUETOOTH_ADVERTISE")
    fun advertise() {
        val service = service ?: throw PeripheralManagerException.NoService()

        val advertiseData = AdvertiseData.Builder()
            .addServiceUuid(ParcelUuid(service.uuid))
            .setIncludeDeviceName(false)
            .build()

        bleAdvertiser.startAdvertising(advertiseSettings, advertiseData, advertiseCallback)
    }

    @SuppressLint("MissingPermission")
    fun stopAdvertising() {
        bleAdvertiser.stopAdvertising(advertiseCallback)
    }

    @RequiresPermission(value = "android.permission.BLUETOOTH_CONNECT")
    fun indicate(message: ByteArray) {
        Log.d(Constants.TAG, "[PERIPHERAL]: Sending indication of ${message.size} bytes.")
        if (isSending) throw PeripheralManagerException.AlreadySending()
        if (connectedClient == null) throw PeripheralManagerException.NoConnectedDevice()
        val indicationCharacteristic =
            indicationCharacteristic ?: throw PeripheralManagerException.NoService()

        Thread {
            isSending = true
            val chunkSize = Integer.min(
                connectedMtu - Constants.NUMBER_OF_BYTES_FOR_DATA_HEADER,
                message.count(),
            )
            for (chunkIndexStart in 0..message.count() step chunkSize) {
                val chunkIndexEnd = Integer.min(chunkIndexStart + chunkSize, message.count()) - 1
                while (!isConnectedClientReady) {
                    Thread.sleep(20)
                }
                val chunkedMessage = message.sliceArray(IntRange(chunkIndexStart, chunkIndexEnd))
                if (chunkedMessage.isEmpty()) {
                    continue
                }
                indicationCharacteristic.value = chunkedMessage
                Log.d(
                    Constants.TAG,
                    "[PERIPHERAL]: Sending chunked message of ${chunkedMessage.size} bytes.",
                )
                isConnectedClientReady = gattServer.notifyCharacteristicChanged(
                    connectedClient,
                    indicationCharacteristic,
                    true,
                )
            }
            while (!isConnectedClientReady) {
                Thread.sleep(20)
            }
            indicationCharacteristic.value = "EOM".toByteArray()
            Log.d(Constants.TAG, "[PERIPHERAL]: Sending 'EOM' message")
            gattServer.notifyCharacteristicChanged(connectedClient, indicationCharacteristic, true)
            isSending = false
        }.start()
    }

    private val gattServerCallback = object : BluetoothGattServerCallback() {
        var message: ByteArray = byteArrayOf()

        // Triggered when the connection state is updated for the peripheral
        @SuppressLint("MissingPermission")
        override fun onConnectionStateChange(device: BluetoothDevice, status: Int, newState: Int) {
            Log.d(
                Constants.TAG,
                "[PERIPHERAL]: Connection state has changed to $newState with status $status",
            )

            if (newState == BluetoothProfile.STATE_CONNECTED) {
                connectedClient = device
            } else {
                connectedClient = null
                val params = Arguments.createMap().apply {
                    putString("identifier", device.address)
                }
                sendEvent(BleDidcommEvent.OnDisconnectedCentral, params)
            }
        }

        // Triggered when the peripheral is ready to send again
        override fun onNotificationSent(device: BluetoothDevice, status: Int) {
            Log.d(Constants.TAG, "[PERIPHERAL]: Sent a notification with status $status")
            super.onNotificationSent(device, status)
            if (status == BluetoothGatt.GATT_SUCCESS) {
                isConnectedClientReady = true
            }
        }

        // Triggered the peripheral received a write request.
        // It appends it to a buffer and when "EOM" is received, it will emit a React Native event
        @SuppressLint("MissingPermission")
        override fun onCharacteristicWriteRequest(
            device: BluetoothDevice,
            requestId: Int,
            characteristic: BluetoothGattCharacteristic,
            preparedWrite: Boolean,
            responseNeeded: Boolean,
            offset: Int,
            value: ByteArray,
        ) {
            Log.d(Constants.TAG, "[PERIPHERAL]: Received a message of ${value.size} bytes.")

            if (characteristic.uuid != writeCharacteristic?.uuid) {
                Log.e(Constants.TAG, "[PERIPHERAL]: Received message for incorrect characteristic.")
                if (responseNeeded) {
                    gattServer.sendResponse(device, requestId, BluetoothGatt.GATT_FAILURE, 0, null)
                }
                return
            }

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
                gattServer.sendResponse(
                    device,
                    requestId,
                    BluetoothGatt.GATT_SUCCESS,
                    offset,
                    value,
                )
            }
        }

        @SuppressLint("MissingPermission")
        override fun onDescriptorReadRequest(
            device: BluetoothDevice,
            requestId: Int,
            offset: Int,
            descriptor: BluetoothGattDescriptor,
        ) {
            if (descriptor.uuid == UUID.fromString(Constants.CCC_DESCRIPTOR_UUID)) {
                Log.d(Constants.TAG, "[PERIPHERAL]: Setting descriptor to enable indications")
                gattServer.sendResponse(
                    device,
                    requestId,
                    BluetoothGatt.GATT_SUCCESS,
                    0,
                    BluetoothGattDescriptor.ENABLE_INDICATION_VALUE,
                )
            } else {
                Log.d(
                    Constants.TAG,
                    "[PERIPHERAL]: Tried to read descriptor which is not the indication descriptor",
                )
                gattServer.sendResponse(device, requestId, BluetoothGatt.GATT_FAILURE, 0, null)
            }
        }

        @SuppressLint("MissingPermission")
        override fun onDescriptorWriteRequest(
            device: BluetoothDevice,
            requestId: Int,
            descriptor: BluetoothGattDescriptor,
            preparedWrite: Boolean,
            responseNeeded: Boolean,
            offset: Int,
            value: ByteArray,
        ) {
            if (descriptor.uuid == UUID.fromString(Constants.CCC_DESCRIPTOR_UUID)) {
                Log.d(
                    Constants.TAG,
                    "[PERIPHERAL]: Received a descriptor write request. Client likely wants to receive notifications or disconnect from us",
                )
                if (responseNeeded) {
                    gattServer.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, 0, null)
                }
            } else {
                Log.d(
                    Constants.TAG,
                    "[PERIPHERAL]: Received a descriptor write request for unsupported descriptor.",
                )
                if (responseNeeded) {
                    gattServer.sendResponse(device, requestId, BluetoothGatt.GATT_FAILURE, 0, null)
                }
            }

            if (descriptor.uuid == UUID.fromString(Constants.CCC_DESCRIPTOR_UUID)) {
                if (Arrays.equals(value, BluetoothGattDescriptor.ENABLE_INDICATION_VALUE)) {
                    val params = Arguments.createMap().apply {
                        putString("identifier", device.address)
                    }
                    sendEvent(BleDidcommEvent.OnConnectedCentral, params)
                    stopAdvertising()
                } else if (Arrays.equals(value, BluetoothGattDescriptor.DISABLE_NOTIFICATION_VALUE)) {
                    connectedClient = null
                    Log.e(Constants.TAG, "Equal disable")
                    val params = Arguments.createMap().apply {
                        putString("identifier", device.address)
                    }
                    sendEvent(BleDidcommEvent.OnDisconnectedPeripheral, params)
                }
            }
        }

        @SuppressLint("MissingPermission")
        override fun onExecuteWrite(device: BluetoothDevice, requestId: Int, execute: Boolean) {
            Log.d(Constants.TAG, "[PERIPHERAL]: Executed write")
            super.onExecuteWrite(device, requestId, execute)
            gattServer.sendResponse(
                device,
                requestId,
                BluetoothGatt.GATT_SUCCESS,
                0,
                null,
            )
        }

        // Triggered when the mtu is updated for the peripheral
        override fun onMtuChanged(device: BluetoothDevice, mtu: Int) {
            Log.d(Constants.TAG, "[PERIPHERAL]: MTU changed to $mtu")
            super.onMtuChanged(device, mtu)
            connectedMtu = mtu
        }
    }

    @SuppressLint("MissingPermission")
    private var gattServer: BluetoothGattServer =
        bluetoothManager.openGattServer(
            context,
            gattServerCallback,
        )
}
