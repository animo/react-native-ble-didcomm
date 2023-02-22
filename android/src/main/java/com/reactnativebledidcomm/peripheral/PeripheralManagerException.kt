package com.reactnativebledidcomm.peripheral

class PeripheralManagerException {
    class NoConnectedDevice : Exception("No connected device found")
    class NoService : Exception("No service defined on the peripheral")
    class NotStarted : Exception("Peripheral has not been started. please call `startPeripheral`")
    class AlreadySending : Exception("Already sending message")
}
