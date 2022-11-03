package com.reactnativebledidcommsdk.central

import android.bluetooth.*
import android.bluetooth.le.ScanCallback
import android.bluetooth.le.ScanFilter
import android.bluetooth.le.ScanSettings
import android.content.Context
import android.os.ParcelUuid
import android.util.Log
import androidx.annotation.RequiresPermission
import com.facebook.react.bridge.ReactContext
import com.reactnativebledidcommsdk.Constants
import java.lang.Integer.min
import java.util.*
import java.util.concurrent.ConcurrentLinkedQueue
import kotlin.math.ceil

class CentralManager(private val context: ReactContext) {
    private val bluetoothManager: BluetoothManager = context.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
    private val bluetoothAdapter: BluetoothAdapter = bluetoothManager.adapter

    val discoveredPeripherals: ArrayList<BluetoothDevice> = arrayListOf()

    var connectedPeripheral: BluetoothGatt? = null
    var connectedMtu: Int? = null
    var isPeripheralReady: Boolean = true

    var serviceUUID: UUID? = null
    var characteristicUUID: UUID? = null
    var characteristic: BluetoothGattCharacteristic? = null

    private var scanCallback: ScanCallback? = null
    private var gattCallback: BluetoothGattCallback? = null

    private val commandQueue: Queue<Runnable> = ConcurrentLinkedQueue()
    private var commandQueueBusy = false

    @RequiresPermission(value = "android.permission.BLUETOOTH_SCAN")
    fun scan(serviceUUID: UUID, characteristicUUID: UUID, scanCallback: ScanCallback) {
        if(this.scanCallback !== null) {
            throw CentralManagerException.AlreadyScanning()
        }
        this.serviceUUID = serviceUUID
        this.characteristicUUID = characteristicUUID
        this.scanCallback = scanCallback
        val scanner = bluetoothAdapter.bluetoothLeScanner

        val settings = ScanSettings.Builder().setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY).build()
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

    @RequiresPermission(allOf = [ "android.permission.BLUETOOTH_CONNECT", "android.permission.BLUETOOTH_SCAN" ])
    fun connect(peripheralId: String, gattCallback: BluetoothGattCallback) {
        this.gattCallback = gattCallback
        val maybeDevice = discoveredPeripherals.find { it.address == peripheralId }
        if(maybeDevice === null) {
            throw CentralManagerException.PeripheralNotFound()
        }

        connectedPeripheral = maybeDevice.connectGatt(context, false, this.gattCallback)
        stopScan()
    }

    @RequiresPermission(value = "android.permission.BLUETOOTH_CONNECT")
    fun write(message: ByteArray) {
        val characteristic = characteristic ?: throw CentralManagerException.NoCharacteristicFound()
        val connectedPeripheral = connectedPeripheral
                ?: throw CentralManagerException.NoConnectedPeripheralFound()

        Log.d(Constants.TAG, "[SENDING]: ${message.toString(Charsets.UTF_8)}")
        Log.d(Constants.TAG, "[LENGTH]: ${message.count()}")
        Thread {
            val chunkSize = min(connectedMtu ?:512, message.count())

            for (i in 0..message.count() step chunkSize) {
                val chunkIndexStart = i
                val chunkIndexEnd = min(chunkIndexStart + chunkSize - 1, message.count() - 1)
                characteristic.value = message.sliceArray(IntRange(chunkIndexStart, chunkIndexEnd))
                while (!isPeripheralReady) { Thread.sleep(200) }
                connectedPeripheral.writeCharacteristic(characteristic)
                isPeripheralReady = false
            }
            while (!isPeripheralReady) { Thread.sleep(200) }
            characteristic.value = "EOM".toByteArray()
            connectedPeripheral.writeCharacteristic(characteristic)
        }.start()


    }
}





























