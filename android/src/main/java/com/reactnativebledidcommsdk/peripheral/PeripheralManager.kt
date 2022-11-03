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
    private val bluetoothManager: BluetoothManager = context.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
    private val bluetoothAdapter: BluetoothAdapter = bluetoothManager.adapter

    var connectedClient: BluetoothDevice? = null
    var connectedMtu: Int? = null

    var service: BluetoothGattService? = null
    var characteristic: BluetoothGattCharacteristic? = null
    var gattServer: BluetoothGattServer? = null

    var advertiseCallback: AdvertiseCallback? = null

    @RequiresPermission(value = "android.permission.BLUETOOTH_CONNECT")
    fun setupServer(gattServerCallback: BluetoothGattServerCallback) {
        this.gattServer = bluetoothManager.openGattServer(context, gattServerCallback)
    }

    @RequiresPermission(value = "android.permission.BLUETOOTH_CONNECT")
    fun setupServiceAndCharacteristic(serviceUUID: UUID, characteristicUUID: UUID) {
        val gattServer = gattServer ?: throw PeripheralManagerException.GattServerNotSet()

        service = BluetoothGattService(serviceUUID, BluetoothGattService.SERVICE_TYPE_PRIMARY)
        characteristic = BluetoothGattCharacteristic(
                characteristicUUID,
                BluetoothGattCharacteristic.PROPERTY_NOTIFY or BluetoothGattCharacteristic.PROPERTY_WRITE,
                BluetoothGattCharacteristic.PERMISSION_WRITE or BluetoothGattCharacteristic.PERMISSION_READ
        )
        characteristic?.writeType = BluetoothGattCharacteristic.WRITE_TYPE_DEFAULT
        service?.addCharacteristic(characteristic)
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
        val characteristic = characteristic
                ?: throw PeripheralManagerException.CharacteristicNotSet()
        val gattServer = gattServer ?: throw PeripheralManagerException.GattServerNotSet()

        characteristic.value = message
        gattServer.notifyCharacteristicChanged(connectedClient, characteristic, false)
    }
}