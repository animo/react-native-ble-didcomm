package com.reactnativebledidcommsdk.peripheral

class PeripheralManagerException {
    class CharacteristicNotSet : Exception("Characteristic is not set")
    class GattServerNotSet : Exception("Gatt Server is not set")
    class AlreadySetup : Exception("Server is already setup")
    class AlreadySending : Exception("Already sending message")
}