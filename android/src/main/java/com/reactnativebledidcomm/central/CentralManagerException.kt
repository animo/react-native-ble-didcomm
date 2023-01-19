package com.reactnativebledidcomm.central

class CentralManagerException {
    class NoService : Exception("No service defined on the central")
    class NotStarted : Exception("Central has not been started. please call `startCentral`")
    class NoCharacteristicFound : Exception("No characteristic found")
    class NoConnectedPeripheralFound : Exception("No connected peripheral found")
    class NotScanning : Exception("No scanning in progress")
    class AlreadyScanning : Exception("Device is already scanning")
    class AlreadySending : Exception("Device is already sending a message")
    class PeripheralNotFound : Exception("Could not find peripheral By Id")
}
