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
import java.util.*

class PeripheralManager(
    context: ReactContext,
    serviceUUID: UUID,
    writeCharacteristicUUID: UUID,
    indicationCharacteristicUUID: UUID,
    gattServerCallback: BluetoothGattServerCallback
) {
    private val bluetoothManager: BluetoothManager =
        context.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
    private val bluetoothAdapter: BluetoothAdapter = bluetoothManager.adapter

    private val writeCharacteristic: BluetoothGattCharacteristic = BluetoothGattCharacteristic(
        writeCharacteristicUUID,
        BluetoothGattCharacteristic.PROPERTY_WRITE,
        BluetoothGattCharacteristic.PERMISSION_WRITE
    )
    private val indicationCharacteristic: BluetoothGattCharacteristic = BluetoothGattCharacteristic(
        indicationCharacteristicUUID,
        BluetoothGattCharacteristic.PROPERTY_INDICATE and BluetoothGattCharacteristic.PROPERTY_READ,
        BluetoothGattCharacteristic.PERMISSION_READ
    )

    private val service: BluetoothGattService =
        BluetoothGattService(serviceUUID, BluetoothGattService.SERVICE_TYPE_PRIMARY).apply {
            this.addCharacteristic(writeCharacteristic)
            this.addCharacteristic(indicationCharacteristic)
        }

    var connectedClient: BluetoothDevice? = null
    var connectedMtu: Int = 20
    var isConnectedClientReady: Boolean = true

    @SuppressLint("MissingPermission")
    var gattServer: BluetoothGattServer =
        bluetoothManager.openGattServer(context, gattServerCallback).apply {
            this.addService(service)
        }

    private var advertiseCallback: AdvertiseCallback? = null
    var gattClientCallback: BluetoothGattCallback? = null

    private var isSending: Boolean = false

    @RequiresPermission(value = "android.permission.BLUETOOTH_ADVERTISE")
    fun advertise(advertiseCallback: AdvertiseCallback) {
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
        advertiseCallback = null
    }

    @RequiresPermission(value = "android.permission.BLUETOOTH_CONNECT")
    fun indicate(message: ByteArray) {
        if (isSending) throw PeripheralManagerException.AlreadySending()

        Thread {
            isSending = true
            val chunkSize = Integer.min(connectedMtu, message.count())
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
