package com.reactnativebledidcommsdk.peripheral

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
    characteristicUUID: UUID,
    notifyCharacteristicUUID: UUID,
    gattServerCallback: BluetoothGattServerCallback
) {
    private val bluetoothManager: BluetoothManager =
        context.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
    private val bluetoothAdapter: BluetoothAdapter = bluetoothManager.adapter

    private val characteristic: BluetoothGattCharacteristic = BluetoothGattCharacteristic(
        characteristicUUID,
        BluetoothGattCharacteristic.PROPERTY_WRITE,
        BluetoothGattCharacteristic.PERMISSION_WRITE
    )
    private val notifyCharacteristic: BluetoothGattCharacteristic = BluetoothGattCharacteristic(
        notifyCharacteristicUUID,
        BluetoothGattCharacteristic.PROPERTY_NOTIFY,
        BluetoothGattCharacteristic.PERMISSION_READ
    )

    private val service: BluetoothGattService =
        BluetoothGattService(serviceUUID, BluetoothGattService.SERVICE_TYPE_PRIMARY).apply {
            this.addCharacteristic(characteristic)
            this.addCharacteristic(notifyCharacteristic)
        }

    var connectedClient: BluetoothDevice? = null
    var isConnectedClientReady: Boolean = true

    @SuppressLint("MissingPermission")
    var gattServer: BluetoothGattServer =
        bluetoothManager.openGattServer(context, gattServerCallback).apply {
            this.addService(service)
        }

    private var advertiseCallback: AdvertiseCallback? = null

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

    @RequiresPermission(value = "android.permission.BLUETOOTH_ADVERTISE")
    fun stopAdvertising() {
        val advertiser = bluetoothAdapter.bluetoothLeAdvertiser
        advertiser.stopAdvertising(advertiseCallback)
        advertiseCallback = null
    }

    @RequiresPermission(value = "android.permission.BLUETOOTH_CONNECT")
    fun notify(message: ByteArray) {
        if (isSending) throw PeripheralManagerException.AlreadySending()

        Thread {
            isSending = true
            val chunkSize = Integer.min(20, message.count())
            for (chunkIndexStart in 0..message.count() step chunkSize) {
                val chunkIndexEnd = Integer.min(chunkIndexStart + chunkSize, message.count()) - 1
                while (!isConnectedClientReady) {
                    Thread.sleep(200)
                }
                notifyCharacteristic.value = message.sliceArray(IntRange(chunkIndexStart, chunkIndexEnd))
                gattServer.notifyCharacteristicChanged(connectedClient, notifyCharacteristic, true)

            }
            while (!isConnectedClientReady) {
                Thread.sleep(200)
            }
            notifyCharacteristic.value = "EOM".toByteArray()
            gattServer.notifyCharacteristicChanged(connectedClient, notifyCharacteristic, true)
            isSending = false
        }.start()
    }
}