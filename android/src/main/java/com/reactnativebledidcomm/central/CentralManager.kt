package com.reactnativebledidcomm.central

import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothGatt
import android.bluetooth.BluetoothGattCallback
import android.bluetooth.BluetoothGattCharacteristic
import android.bluetooth.BluetoothGattDescriptor
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothProfile
import android.bluetooth.le.ScanCallback
import android.bluetooth.le.ScanFilter
import android.bluetooth.le.ScanResult
import android.bluetooth.le.ScanSettings
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
import java.lang.Integer.min
import java.util.UUID

class CentralManager(private val context: ReactContext) {
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

    private val bleScanner by lazy {
        bluetoothAdapter.bluetoothLeScanner
    }

    private val discoveredPeripherals: ArrayList<BluetoothDevice> = arrayListOf()

    var connectedGatt: BluetoothGatt? = null
    var connectedMtu = 20

    private var isSending = false
    var isPeripheralReady = true

    var characteristicWrite: BluetoothGattCharacteristic? = null
    var characteristicIndication: BluetoothGattCharacteristic? = null

    var serviceUUID: UUID? = null
    var characteristicWriteUUID: UUID? = null
    var characteristicIndicationUUID: UUID? = null

    fun setService(
        serviceUUID: UUID,
        writeCharacteristicUUID: UUID,
        indicationCharacteristicUUID: UUID,
    ) {
        this.serviceUUID = serviceUUID
        this.characteristicWriteUUID = writeCharacteristicUUID
        this.characteristicIndicationUUID = indicationCharacteristicUUID
    }

    @SuppressLint("MissingPermission")
    fun shutdownCentral() {
        try {
            this.stopScan()
            this.connectedGatt?.disconnect()
            this.connectedGatt?.close()
        } catch (e: CentralManagerException.NotScanning) {
            // Not Scanning
        } catch (e: Exception) {
            // Error we don't care about
        } finally {
            this.serviceUUID = null
            this.characteristicWriteUUID = null
            this.characteristicIndicationUUID = null
            this.connectedGatt = null
            this.discoveredPeripherals.clear()
        }
    }

    @RequiresPermission(value = "android.permission.BLUETOOTH_SCAN")
    fun scan() {
        val serviceUUID = this.serviceUUID
            ?: throw CentralManagerException.NoService()

        val settings = ScanSettings
            .Builder()
            .setScanMode(ScanSettings.SCAN_MODE_BALANCED)
            .setReportDelay(0)
            .build()

        val filter = ScanFilter.Builder().setServiceUuid(ParcelUuid(serviceUUID)).build()
        val filters = listOf(filter)

        bleScanner.startScan(filters, settings, scanCallback)
    }

    @RequiresPermission(value = "android.permission.BLUETOOTH_SCAN")
    fun stopScan() {
        bleScanner.stopScan(scanCallback)
    }

    @RequiresPermission(allOf = ["android.permission.BLUETOOTH_CONNECT", "android.permission.BLUETOOTH_SCAN"])
    fun connect(peripheralId: String) {
        val maybeDevice = discoveredPeripherals.find { it.address == peripheralId }
            ?: throw CentralManagerException.PeripheralNotFound()

        connectedGatt = maybeDevice.connectGatt(context, false, gattClientCallback)
        stopScan()
    }

    @RequiresPermission(value = "android.permission.BLUETOOTH_CONNECT")
    fun write(message: ByteArray) {
        Log.d(Constants.TAG, "[CENTRAL]: Sending message of ${message.size} bytes.")
        if (isSending) throw CentralManagerException.AlreadySending()
        val characteristic =
            characteristicWrite ?: throw CentralManagerException.NoCharacteristicFound()
        val connectedPeripheral = connectedGatt
            ?: throw CentralManagerException.NoConnectedPeripheralFound()

        // Check whether the characteristic is writable
        if ((characteristic.properties and BluetoothGattCharacteristic.PROPERTY_WRITE) == 0) {
            throw CentralManagerException.CharacteristicIsNotWritable()
        }

        characteristic.writeType = BluetoothGattCharacteristic.WRITE_TYPE_DEFAULT

        Thread {
            isSending = true
            val chunkSize =
                min(connectedMtu - Constants.NUMBER_OF_BYTES_FOR_DATA_HEADER, message.count())
            for (chunkIndexStart in 0..message.count() step chunkSize) {
                val chunkIndexEnd = min(chunkIndexStart + chunkSize, message.count()) - 1
                val chunkedMessage = message.sliceArray(IntRange(chunkIndexStart, chunkIndexEnd))
                characteristic.value = chunkedMessage
                while (!isPeripheralReady) {
                    Thread.sleep(20)
                }
                Log.d(
                    Constants.TAG,
                    "[CENTRAL]: Sending chunked message of ${chunkedMessage.size} bytes."
                )
                val didSend = connectedPeripheral.writeCharacteristic(characteristic)
                if (didSend) {
                    Log.d(
                        Constants.TAG,
                        "[CENTRAL]: Send the message"
                    )
                } else {
                    Log.d(
                        Constants.TAG,
                        "[CENTRAL]: Did not send the message"
                    )
                }
                isPeripheralReady = false
            }
            while (!isPeripheralReady) {
                Thread.sleep(20)
            }
            characteristic.value = "EOM".toByteArray()
            Log.d(Constants.TAG, "[CENTRAL]: Sending 'EOM' message")
            connectedPeripheral.writeCharacteristic(characteristic)
            isSending = false
        }.start()
    }

    @SuppressLint("MissingPermission")
    private fun subscribeToIndication(
        characteristic: BluetoothGattCharacteristic,
        gatt: BluetoothGatt
    ) {
        val cccdUuid = UUID.fromString(Constants.CCC_DESCRIPTOR_UUID)
        characteristic.getDescriptor(cccdUuid)?.let { cccDescriptor ->
            if (!gatt.setCharacteristicNotification(characteristic, true)) {
                Log.e(
                    Constants.TAG,
                    "[CENTRAL]: Could not set notifications for characteristic ${characteristic.uuid}"
                )
                return
            }
            cccDescriptor.value = BluetoothGattDescriptor.ENABLE_INDICATION_VALUE
            gatt.writeDescriptor(cccDescriptor)
        }
    }

    @SuppressLint("MissingPermission")
    private fun unsubscribeFromCharacteristic(characteristic: BluetoothGattCharacteristic) {
        val gatt = connectedGatt ?: return

        val cccdUuid = UUID.fromString(Constants.CCC_DESCRIPTOR_UUID)
        characteristic.getDescriptor(cccdUuid)?.let { cccDescriptor ->
            if (!gatt.setCharacteristicNotification(characteristic, false)) {
                Log.e(
                    Constants.TAG,
                    "[CENTRAL]: Could not unsubscribe from  characteristic ${characteristic.uuid}"
                )
                return
            }
            cccDescriptor.value = BluetoothGattDescriptor.DISABLE_NOTIFICATION_VALUE
            gatt.writeDescriptor(cccDescriptor)
        }
    }

    private val gattClientCallback = object : BluetoothGattCallback() {
        var message: ByteArray = byteArrayOf()

        // Triggered when the connection state is updated
        @SuppressLint("MissingPermission")
        override fun onConnectionStateChange(gatt: BluetoothGatt, status: Int, newState: Int) {
            Log.d(
                Constants.TAG,
                "[CENTRAL]: Connection state has been changed to $newState with status $status"
            )

            if (status == BluetoothGatt.GATT_SUCCESS) {
                val params = Arguments.createMap().apply {
                    putString("identifier", gatt.device.address)
                }
                if (newState == BluetoothProfile.STATE_CONNECTED) {
                    gatt.requestMtu(512)
                    stopScan()
                    sendEvent(BleDidcommEvent.OnConnectedPeripheral, params)
                } else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
                    sendEvent(BleDidcommEvent.OnDisconnectedPeripheral, params)
                    gatt.close()
                    connectedGatt = null
                }
            } else {
                gatt.close()
            }
        }

        // Triggered when client discovered services
        @SuppressLint("MissingPermission")
        override fun onServicesDiscovered(gatt: BluetoothGatt, status: Int) {
            Log.d(Constants.TAG, "[CENTRAL]: Discovered services with status $status")

            val service = gatt.getService(serviceUUID) ?: run {
                Log.d(Constants.TAG, "[CENTRAL]: Service with $serviceUUID does not exist on GATT.")
                gatt.disconnect()
                return
            }

            characteristicWrite =
                service.getCharacteristic(characteristicWriteUUID) ?: run {
                    Log.d(Constants.TAG, "[CENTRAL]: Indication characteristic not found")
                    gatt.disconnect()
                    return
                }

            characteristicIndication =
                service.getCharacteristic(characteristicIndicationUUID) ?: run {
                    Log.d(Constants.TAG, "[CENTRAL]: Indication characteristic not found")
                    gatt.disconnect()
                    return
                }

            gatt.setCharacteristicNotification(characteristicIndication, true)
            val descriptor =
                characteristicIndication?.getDescriptor(UUID.fromString(Constants.CCC_DESCRIPTOR_UUID))
                    ?: run {
                        Log.d(
                            Constants.TAG,
                            "[CENTRAL]: Indication Descriptor not found. Make sure CCC is set on the descriptor. Task of the peripheral"
                        )
                        gatt.disconnect()
                        return
                    }

            descriptor.value = BluetoothGattDescriptor.ENABLE_INDICATION_VALUE
            gatt.writeDescriptor(descriptor)
        }

        // Triggered when the client is ready to send the next message
        override fun onCharacteristicWrite(
            gatt: BluetoothGatt,
            characteristic: BluetoothGattCharacteristic,
            status: Int,
        ) {
            Log.d(Constants.TAG, "[CENTRAL]: Characteristic write triggered, ready to write again.")
            if (status == BluetoothGatt.GATT_SUCCESS) {
                isPeripheralReady = true
            }
        }

        // Triggered when client receives an indication
        override fun onCharacteristicChanged(
            gatt: BluetoothGatt,
            characteristic: BluetoothGattCharacteristic,
        ) {
            Log.d(
                Constants.TAG,
                "[CENTRAL]: Received an indication of ${characteristic.value.size} bytes."
            )

            if (characteristic.uuid == characteristicIndicationUUID) {
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
            } else {
                Log.e(Constants.TAG, "Received indication for thr wrong UUID.")
            }
        }

        override fun onDescriptorWrite(
            gatt: BluetoothGatt,
            descriptor: BluetoothGattDescriptor,
            status: Int
        ) {
            super.onDescriptorWrite(gatt, descriptor, status)
            Log.d(Constants.TAG, "[CENTRAL]: Descriptor write. Connection is ready")
        }

        // Triggered when the MTU has been changed.
        @SuppressLint("MissingPermission")
        override fun onMtuChanged(gatt: BluetoothGatt, mtu: Int, status: Int) {
            Log.d(Constants.TAG, "[CENTRAL]: MTU has been updated to $mtu with status $status.")
            super.onMtuChanged(gatt, mtu, status)
            if (status != BluetoothGatt.GATT_SUCCESS) {
                Log.e(Constants.TAG, "error occurred while requesting MTU. Status $status")
                return
            }
            connectedMtu = mtu
            gatt.discoverServices()
        }
    }

    private val scanCallback = object : ScanCallback() {
        @SuppressLint("MissingPermission")
        override fun onScanResult(callbackType: Int, result: ScanResult) {
            val name = result.scanRecord?.deviceName ?: result.device.name ?: result.device.address
            Log.d(Constants.TAG, "[CENTRAL]: Found item $name")
            super.onScanResult(callbackType, result)

            discoveredPeripherals.add(result.device)
            val params = Arguments.createMap().apply {
                putString("identifier", result.device.address)
            }
            sendEvent(BleDidcommEvent.OnDiscoverPeripheral, params)
        }
    }
}





































