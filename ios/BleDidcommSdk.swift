import CoreBluetooth
import Foundation
import os
import React

@objc(BleDidcommSdk)
class BleDidcommSdk: React.RCTEventEmitter {
    enum GenericError: Error {
        case NoService
        case UnableToConvertString
        case NoPeripheralFound
    }

    var peripheralManager: CBPeripheralManager?
    var centralManager: CBCentralManager?

    var service: CBMutableService?
    var characteristic: CBMutableCharacteristic?
    var sendableCharacteristic: CBCharacteristic?

    var peripherals: [CBPeripheral] = []

    var isPeripheralReady = true

    var message: String = ""

    var connectedCentral: CBCentral?

    @objc func start(_: [String: String],
                     resolve: RCTPromiseResolveBlock,
                     reject _: RCTPromiseRejectBlock)
    {
        peripheralManager = CBPeripheralManager(
            delegate: self,
            queue: nil,
            options: [CBPeripheralManagerOptionShowPowerAlertKey: true]
        )
        centralManager = CBCentralManager(
            delegate: self,
            queue: nil,
            options: [CBCentralManagerOptionShowPowerAlertKey: true]
        )

        resolve(nil)
    }

    @objc func preparePeripheral(_ serviceUUID: String,
                                 characteristicUUID: String,
                                 resolve: RCTPromiseResolveBlock,
                                 reject: RCTPromiseRejectBlock)
    {
        guard peripheralManager != nil else {
            reject("error", "Uninitialized, call `start()` first", nil)
            return
        }

        guard UUID(uuidString: serviceUUID) != nil else {
            reject("error", "Service UUID `" + serviceUUID + "` is not a UUID", nil)
            return
        }

        guard UUID(uuidString: characteristicUUID) != nil else {
            reject("error", "characteristic UUID `" + characteristicUUID + "` is not a UUID", nil)
            return
        }

        preparePeripheral(serviceUUID: serviceUUID, characteristicUUID: characteristicUUID)

        resolve(nil)
    }

    @objc func advertise(_: [String: String],
                         resolve: RCTPromiseResolveBlock,
                         reject: RCTPromiseRejectBlock)
    {
        guard peripheralManager != nil else {
            reject("error", "Uninitialized, call `start()` first", nil)
            return
        }

        guard service != nil else {
            reject("error", "Service not set!", nil)
            return
        }

        advertise()

        resolve(nil)
    }

    @objc func notify(_ message: String,
                      resolve: RCTPromiseResolveBlock,
                      reject: RCTPromiseRejectBlock)
    {
        guard peripheralManager != nil || characteristic != nil else {
            reject("error", "Uninitialized, call `start()` first", nil)
            return
        }

        guard connectedCentral != nil else {
            reject("error", "Could not find the connected central to notify", nil)
            return
        }

        guard let data = message.data(using: .utf8) else {
            reject("error", "Could not convert data to bytes. Invalid UTF-8 encoding?", nil)
            return
        }

        notify(message: data)

        resolve(nil)
    }

    @objc func scan(_ 
                    serviceUUID: String,
                    _: String,
                    resolve: RCTPromiseResolveBlock,
                    reject: RCTPromiseRejectBlock)
    {
        guard centralManager != nil else {
            reject("error", "Uninitialized, call `start()` first", nil)
            return
        }

        guard UUID(uuidString: serviceUUID) != nil else {
            reject("error", "serviceUUID`" + serviceUUID + "` is not a UUID", nil)
            return
        }

        scan(UUID(uuidString: serviceUUID))

        resolve(nil)
    }

    @objc func connect(_ peripheralId: String,
                       resolve: RCTPromiseResolveBlock,
                       reject: RCTPromiseRejectBlock)
    {
        guard centralManager != nil else {
            reject("error", "Uninitialized, call `start()` first", nil)
            return
        }

        guard UUID(uuidString: peripheralId) != nil else {
            reject("error", "peripheralId `" + peripheralId + "` is not a UUID", nil)
            return
        }

        guard let peripheral = findPeripheralById(peripheralId: peripheralId) else {
            reject("error", "peripheralId `" + peripheralId + "` could not be found.", nil)
            return
        }

        connect(peripheral: peripheral)

        resolve(nil)
    }

    @objc func write(_ peripheralId: String,
                     message: String,
                     resolve: RCTPromiseResolveBlock,
                     reject: RCTPromiseRejectBlock)
    {
        guard centralManager != nil else {
            reject("error", "Uninitialized, call `start()` first", nil)
            return
        }

        guard UUID(uuidString: peripheralId) != nil else {
            reject("error", "peripheralId `" + peripheralId + "` is not a UUID", nil)
            return
        }

        guard let peripheral = findPeripheralById(peripheralId: peripheralId) else {
            reject("error", "peripheralId `" + peripheralId + "` could not be found.", nil)
            return
        }

        guard sendableCharacteristic != nil else {
            reject("error", "Could not find the characteristic to write to", nil)
            return
        }

        guard let data = message.data(using: String.Encoding.utf8) else {
            reject("error", "Message `" + message + "` could not be encoded with UTF-8 ", nil)
            return
        }

        write(peripheral: peripheral, message: data)

        resolve(nil)
    }
}
