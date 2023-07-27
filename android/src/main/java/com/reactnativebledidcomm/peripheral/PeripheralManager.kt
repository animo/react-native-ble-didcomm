package com.reactnativebledidcomm.peripheral

import android.annotation.SuppressLint
import android.bluetooth.*
import android.bluetooth.le.AdvertiseCallback
import android.bluetooth.le.AdvertiseData
import android.bluetooth.le.AdvertiseSettings
import android.content.Context
import android.os.ParcelUuid
import androidx.annotation.RequiresPermission
import com.facebook.react.bridge.ReactContext
import com.reactnativebledidcomm.Constants
import java.util.*

class PeripheralManager(
    context: ReactContext,
    gattServerCallback: BluetoothGattServerCallback
) {
    private val bluetoothManager: BluetoothManager =
        context.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
    private val bluetoothAdapter: BluetoothAdapter = bluetoothManager.adapter

    private var writeCharacteristic: BluetoothGattCharacteristic? = null
    private var indicationCharacteristic: BluetoothGattCharacteristic? = null
    private var service: BluetoothGattService? = null

    var connectedClient: BluetoothDevice? = null
    var connectedMtu: Int = 20
    var isConnectedClientReady: Boolean = true

    @SuppressLint("MissingPermission")
    var gattServer: BluetoothGattServer =
        bluetoothManager.openGattServer(context, gattServerCallback)

    private var advertiseCallback: AdvertiseCallback? = null
    var gattClientCallback: BluetoothGattCallback? = null

    private var isSending: Boolean = false

    @SuppressLint("MissingPermission")
    fun setService(
        serviceUUID: UUID,
        writeCharacteristicUUID: UUID,
        indicationCharacteristicUUID: UUID
    ) {
        this.writeCharacteristic = BluetoothGattCharacteristic(
            writeCharacteristicUUID,
            BluetoothGattCharacteristic.PROPERTY_WRITE,
            BluetoothGattCharacteristic.PERMISSION_WRITE
        )
        this.indicationCharacteristic = BluetoothGattCharacteristic(
            indicationCharacteristicUUID,
            BluetoothGattCharacteristic.PROPERTY_INDICATE,
            BluetoothGattCharacteristic.PERMISSION_WRITE
        )
        val descriptor = BluetoothGattDescriptor(UUID.fromString(Constants.CCC_DESCRIPTOR_UUID), BluetoothGattDescriptor.PERMISSION_WRITE)
        this.indicationCharacteristic?.addDescriptor(descriptor)
        this.service =
            BluetoothGattService(serviceUUID, BluetoothGattService.SERVICE_TYPE_PRIMARY).apply {
                this.addCharacteristic(writeCharacteristic)
                this.addCharacteristic(indicationCharacteristic)
            }

        gattServer.addService(this.service)
    }

    fun shutdownPeripheral() {
        val connectedDevices = this.bluetoothManager.getConnectedDevices(BluetoothProfile.GATT)
        for (device in connectedDevices) {
            this.gattServer.cancelConnection(device)
        }
        
        try {
            this.stopAdvertising()
        } catch (e: Exception) {
            // Do nothing
        }
        this.writeCharacteristic = null
        this.connectedClient = null
        this.indicationCharacteristic = null
        this.service = null
    }

    @RequiresPermission(value = "android.permission.BLUETOOTH_ADVERTISE")
    fun advertise(advertiseCallback: AdvertiseCallback) {
        val service =
            this.service ?: throw PeripheralManagerException.NoService()
        this.advertiseCallback = advertiseCallback

        val advertiser = bluetoothAdapter.bluetoothLeAdvertiser
        val advertiseSettings = AdvertiseSettings.Builder()
            .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_POWER)
            .setTimeout(0)
            .build()

        val advertiseData = AdvertiseData.Builder()
            .addServiceUuid(ParcelUuid(service.uuid))
            .setIncludeDeviceName(false)
            .build()

        advertiser.startAdvertising(advertiseSettings, advertiseData, this.advertiseCallback)
    }

    @Suppress("unused")
    @RequiresPermission(value = "android.permission.BLUETOOTH_ADVERTISE")
    fun stopAdvertising() {
        val advertiser = bluetoothAdapter.bluetoothLeAdvertiser
        advertiser.stopAdvertising(advertiseCallback)
        this.gattServer.close()
        advertiseCallback = null
    }

    @RequiresPermission(value = "android.permission.BLUETOOTH_CONNECT")
    fun indicate(message: ByteArray) {
        if (isSending) throw PeripheralManagerException.AlreadySending()
        if (connectedClient == null) throw PeripheralManagerException.NoConnectedDevice()
        val indicationCharacteristic =
            this.indicationCharacteristic ?: throw PeripheralManagerException.NoService()

        Thread {
            isSending = true
            val chunkSize = Integer.min(connectedMtu - Constants.NUMBER_OF_BYTES_FOR_DATA_HEADER, message.count())
            for (chunkIndexStart in 0..message.count() step chunkSize) {
                val chunkIndexEnd = Integer.min(chunkIndexStart + chunkSize, message.count()) - 1
                while (!isConnectedClientReady) {
                    Thread.sleep(20)
                }
                indicationCharacteristic.value =
                    message.sliceArray(IntRange(chunkIndexStart, chunkIndexEnd))
                gattServer.notifyCharacteristicChanged(
                    connectedClient,
                    indicationCharacteristic,
                    true
                )

            }
            while (!isConnectedClientReady) {
                Thread.sleep(20)
            }
            indicationCharacteristic.value = "EOM".toByteArray()
            gattServer.notifyCharacteristicChanged(connectedClient, indicationCharacteristic, true)
            isSending = false
        }.start()
    }
}
