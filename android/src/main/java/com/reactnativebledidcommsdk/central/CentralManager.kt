package com.reactnativebledidcommsdk.central

import android.bluetooth.*
import android.bluetooth.le.ScanCallback
import android.bluetooth.le.ScanFilter
import android.bluetooth.le.ScanSettings
import android.content.Context
import android.os.ParcelUuid
import androidx.annotation.RequiresPermission
import com.facebook.react.bridge.ReactContext
import java.lang.Integer.min
import java.util.*

class CentralManager(
    private val context: ReactContext,
    var serviceUUID: UUID,
    var characteristicUUID: UUID,
    var notifyCharacteristicUUID: UUID
) {
    private val bluetoothManager: BluetoothManager =
        context.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
    private val bluetoothAdapter: BluetoothAdapter = bluetoothManager.adapter

    val discoveredPeripherals: ArrayList<BluetoothDevice> = arrayListOf()

    var connectedPeripheral: BluetoothGatt? = null
    var isPeripheralReady: Boolean = true

    var characteristic: BluetoothGattCharacteristic? = null
    var notifyCharacteristic: BluetoothGattCharacteristic? = null

    private var scanCallback: ScanCallback? = null
    private var gattCallback: BluetoothGattCallback? = null

    private var isSending: Boolean = false

    @RequiresPermission(value = "android.permission.BLUETOOTH_SCAN")
    fun scan(scanCallback: ScanCallback) {
        if (this.scanCallback !== null) {
            throw CentralManagerException.AlreadyScanning()
        }
        this.scanCallback = scanCallback
        val scanner = bluetoothAdapter.bluetoothLeScanner

        val settings =
            ScanSettings.Builder().setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY).build()
        val filter = ScanFilter.Builder().setServiceUuid(ParcelUuid(serviceUUID)).build()
        val filters = listOf(filter)

        scanner.startScan(filters, settings, this.scanCallback)
    }

    @RequiresPermission(value = "android.permission.BLUETOOTH_SCAN")
    fun stopScan() {
        scanCallback ?: throw CentralManagerException.NotScanning()

        val scanner = bluetoothAdapter.bluetoothLeScanner
        scanner.stopScan(this.scanCallback)
    }

    @RequiresPermission(allOf = ["android.permission.BLUETOOTH_CONNECT", "android.permission.BLUETOOTH_SCAN"])
    fun connect(peripheralId: String, gattCallback: BluetoothGattCallback) {
        this.gattCallback = gattCallback
        val maybeDevice = discoveredPeripherals.find { it.address == peripheralId }
            ?: throw CentralManagerException.PeripheralNotFound()

        connectedPeripheral = maybeDevice.connectGatt(context, false, this.gattCallback)
        stopScan()
    }

    @RequiresPermission(value = "android.permission.BLUETOOTH_CONNECT")
    fun write(message: ByteArray) {
        if (isSending) throw CentralManagerException.AlreadySending()
        val characteristic = characteristic ?: throw CentralManagerException.NoCharacteristicFound()
        val connectedPeripheral = connectedPeripheral
            ?: throw CentralManagerException.NoConnectedPeripheralFound()

        Thread {
            isSending = true
            // TODO: test interoperability with a chunkSize of 512
            val chunkSize = min(512, message.count())
            for (chunkIndexStart in 0..message.count() step chunkSize) {
                val chunkIndexEnd = min(chunkIndexStart + chunkSize, message.count()) - 1
                characteristic.value = message.sliceArray(IntRange(chunkIndexStart, chunkIndexEnd))
                while (!isPeripheralReady) {
                    Thread.sleep(200)
                }
                connectedPeripheral.writeCharacteristic(characteristic)
                isPeripheralReady = false
            }
            while (!isPeripheralReady) {
                Thread.sleep(200)
            }
            characteristic.value = "EOM".toByteArray()
            connectedPeripheral.writeCharacteristic(characteristic)
            isSending = false
        }.start()
    }
}
