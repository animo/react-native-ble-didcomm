package com.reactnativebledidcommsdk.central

class CentralManagerException {
    class NoCharacteristicFound : Exception("No characteristic found")
    class NoConnectedPeripheralFound : Exception("No connected peripheral found")
    class NotScanning : Exception("No scanning in progress")
    class AlreadyScanning : Exception("Device is already scanning")
    class PeripheralNotFound : Exception("Could not find peripheral By Id")
}