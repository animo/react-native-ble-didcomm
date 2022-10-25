package com.reactnativebledidcommsdk

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableMap

import java.util.UUID
import java.util.regex.Pattern

import android.util.Log
import android.content.Context
import android.bluetooth.*

object RegexConstants {
    const val UUID_REGEX = "[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}"
}

class BleDidcommSdkModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private val context: Context = reactContext

    private val adapter: BluetoothAdapter = BluetoothAdapter.getDefaultAdapter()
    private lateinit var manager: BluetoothManager
    public var gattServer: BluetoothGattServer? = null
    
    private var gattService: BluetoothGattService? = null
    private var gattCharacteristic: BluetoothGattCharacteristic? = null

    override fun getName(): String { return "BleDidcommSdk" }

    private fun setupGattServer() {
        val gattServerCallback = GattServerCallback()
        gattServer = manager.openGattServer(context, gattServerCallback).apply {
            addService(gattService)
        }
    }

    private inner class GattServerCallback : BluetoothGattServerCallback() {
        override fun onConnectionStateChange(device: BluetoothDevice, status: Int, newState: Int) {
            Log.d("BLEDIDComm", "onConnecteionStateChange")
            super.onConnectionStateChange(device, status, newState)
        }

        override fun onCharacteristicWriteRequest(
            device: BluetoothDevice,
            requestId: Int,
            characteristic: BluetoothGattCharacteristic,
            preparedWrite: Boolean,
            responseNeeded: Boolean,
            offset: Int,
            value: ByteArray?
        ) {
            super.onCharacteristicWriteRequest(device, requestId, characteristic, preparedWrite, responseNeeded, offset, value)
            gattServer?.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, 0, null)
            val message = value?.toString(Charsets.UTF_8)
            Log.d("BLEDIDComm", "onCharacteristicWriteRequest: with message: \"$message\"")
        }
    }

    @ReactMethod
    fun start(options: ReadableMap, promise: Promise) {
        manager = context.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
        if(adapter.isEnabled) {
            setupGattServer()
        } else {
          // TODO: request permissions
        }
        promise.resolve(null)
    }

    @ReactMethod
    fun setService(serviceUUID: String, promise: Promise) {
          if(!Pattern.matches(RegexConstants.UUID_REGEX, serviceUUID)) { 
              promise.reject("Service UUID `" + serviceUUID + "` is not a UUID")
          }

          gattService = BluetoothGattService(UUID.fromString(serviceUUID), BluetoothGattService.SERVICE_TYPE_PRIMARY)

          promise.resolve(null)
    }

    @ReactMethod
    fun addCharacteristic(characteristicUUID: String, promise: Promise) {
          if(!Pattern.matches(RegexConstants.UUID_REGEX, characteristicUUID)) { 
              promise.reject("charateristic UUID `" + characteristicUUID + "` is not a UUID")
          }

          gattCharacteristic = BluetoothGattCharacteristic(
              UUID.fromString(characteristicUUID),
              BluetoothGattCharacteristic.PROPERTY_BROADCAST or
              BluetoothGattCharacteristic.PROPERTY_WRITE or
              BluetoothGattCharacteristic.PROPERTY_WRITE_NO_RESPONSE or
              BluetoothGattCharacteristic.PROPERTY_READ or
              BluetoothGattCharacteristic.PROPERTY_NOTIFY,
              BluetoothGattCharacteristic.PERMISSION_READ or
              BluetoothGattCharacteristic.PERMISSION_WRITE
          )

          // TODO: we should throw an error if this is not defined
          gattService?.addCharacteristic(gattCharacteristic)

          promise.resolve(null)
    }

    @ReactMethod
    fun notify(message: String, promise: Promise) {
          val devices = manager.getConnectedDevices(BluetoothProfile.GATT)
          gattCharacteristic?.setValue(message)
          
          for(device in devices) {
              Log.d("BLEDIDComm", "Sending " + message)
              val resp = gattServer?.notifyCharacteristicChanged(
                  device,
                  gattCharacteristic,
                  false
              )
              Log.d("BLEDIDComm", "Response: $resp")
          }
          
          promise.resolve(null)
    }
}
