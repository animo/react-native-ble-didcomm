package com.reactnativebledidcommsdk.peripheral

import android.bluetooth.*
import android.bluetooth.le.AdvertiseCallback
import android.bluetooth.le.AdvertiseData
import android.bluetooth.le.AdvertiseSettings
import android.content.Context
import android.os.ParcelUuid
import androidx.annotation.RequiresPermission
import com.facebook.react.bridge.ReactContext
import java.util.*

class PeripheralManager(private val context: ReactContext) {
    private val bluetoothManager: BluetoothManager =
        context.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
    private val bluetoothAdapter: BluetoothAdapter = bluetoothManager.adapter

    var connectedClient: BluetoothDevice? = null
    var isConnectedClientReady: Boolean = true

    var service: BluetoothGattService? = null
    var characteristic: BluetoothGattCharacteristic? = null
    var notifyCharacteristic: BluetoothGattCharacteristic? = null
    var gattServer: BluetoothGattServer? = null

    var advertiseCallback: AdvertiseCallback? = null

    private var isSending: Boolean = false

    @RequiresPermission(value = "android.permission.BLUETOOTH_CONNECT")
    fun setupServer(gattServerCallback: BluetoothGattServerCallback) {
        this.gattServer = bluetoothManager.openGattServer(context, gattServerCallback)
    }

    @RequiresPermission(value = "android.permission.BLUETOOTH_CONNECT")
    fun initialize(serviceUUID: UUID, characteristicUUID: UUID, notifyCharacteristicUUID: UUID) {
        val gattServer = gattServer ?: throw PeripheralManagerException.GattServerNotSet()

        service = BluetoothGattService(serviceUUID, BluetoothGattService.SERVICE_TYPE_PRIMARY)
        characteristic = BluetoothGattCharacteristic(
            characteristicUUID,
            BluetoothGattCharacteristic.PROPERTY_WRITE,
            BluetoothGattCharacteristic.PERMISSION_WRITE
        )
        notifyCharacteristic = BluetoothGattCharacteristic(
            notifyCharacteristicUUID,
            BluetoothGattCharacteristic.PROPERTY_NOTIFY,
            BluetoothGattCharacteristic.PERMISSION_READ
        )
        service?.addCharacteristic(characteristic)
        service?.addCharacteristic(notifyCharacteristic)
        gattServer.addService(service)
    }

    @RequiresPermission(value = "android.permission.BLUETOOTH_ADVERTISE")
    fun advertise(advertiseCallback: AdvertiseCallback) {
        this.advertiseCallback = advertiseCallback

        val advertiser = bluetoothAdapter.bluetoothLeAdvertiser
        val advertiseSettings = AdvertiseSettings.Builder()
            .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_POWER)
            .setTimeout(0)
            .build()

        val advertiseData = AdvertiseData.Builder()
            .addServiceUuid(ParcelUuid(service?.uuid))
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
        val characteristic = notifyCharacteristic
            ?: throw PeripheralManagerException.CharacteristicNotSet()
        val gattServer = gattServer ?: throw PeripheralManagerException.GattServerNotSet()

        Thread {
            isSending = true
            val chunkSize = Integer.min(20, message.count())
            for (chunkIndexStart in 0..message.count() step chunkSize) {
                val chunkIndexEnd = Integer.min(chunkIndexStart + chunkSize, message.count()) - 1
                while (!isConnectedClientReady) {
                    Thread.sleep(200)
                }
                characteristic.value = message.sliceArray(IntRange(chunkIndexStart, chunkIndexEnd))
                gattServer.notifyCharacteristicChanged(connectedClient, characteristic, true)

            }
            while (!isConnectedClientReady) {
                Thread.sleep(200)
            }
            characteristic.value = "EOM".toByteArray()
            gattServer.notifyCharacteristicChanged(connectedClient, characteristic, true)
            isSending = false
        }.start()
    }
}