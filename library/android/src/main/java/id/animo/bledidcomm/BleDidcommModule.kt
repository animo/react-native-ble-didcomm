package id.animo.bledidcomm

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothManager
import android.content.Context
import androidx.annotation.RequiresPermission
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import id.animo.bledidcomm.central.CentralManager
import id.animo.bledidcomm.central.CentralManagerException
import id.animo.bledidcomm.peripheral.PeripheralManager
import id.animo.bledidcomm.peripheral.PeripheralManagerException
import java.util.UUID

class BleDidcommModule(private val context: ReactApplicationContext) :
    ReactContextBaseJavaModule(context) {
    private var centralManager: CentralManager? = null
    private var peripheralManager: PeripheralManager? = null
    private val bluetoothAdapter = (context.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager).adapter

    override fun getName(): String {
        return Constants.TAG
    }

    @ReactMethod
    fun isBleEnabled(
        @Suppress("UNUSED_PARAMETER") options: ReadableMap,
        promise: Promise,
    ) {
        try {
            promise.resolve(bluetoothAdapter.state == BluetoothAdapter.STATE_ON)
        } catch (e: Exception) {
            promise.reject("error", e)
        }
    }

    @ReactMethod
    fun startCentral(
        @Suppress("UNUSED_PARAMETER") options: ReadableMap,
        promise: Promise,
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
        promise: Promise,
    ) {
        try {
            this.peripheralManager = PeripheralManager(context)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("error", e)
        }
    }

    @ReactMethod
    fun shutdownCentral(
        @Suppress("UNUSED_PARAMETER") options: ReadableMap,
        promise: Promise,
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
        promise: Promise,
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
        promise: Promise,
    ) {
        try {
            val centralManager =
                this.centralManager ?: throw CentralManagerException.NotStarted()
            centralManager.setService(
                UUID.fromString(serviceUUID),
                UUID.fromString(writeCharacteristicUUID),
                UUID.fromString(indicationCharacteristicUUID),
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
        promise: Promise,
    ) {
        try {
            val peripheralManager =
                this.peripheralManager ?: throw PeripheralManagerException.NotStarted()
            peripheralManager.setService(
                UUID.fromString(serviceUUID),
                UUID.fromString(writeCharacteristicUUID),
                UUID.fromString(indicationCharacteristicUUID),
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
            centralManager.scan()
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
            peripheralManager.advertise()
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
            centralManager.connect(peripheralId)
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
}
