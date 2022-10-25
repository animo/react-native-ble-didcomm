import CoreBluetooth
import os
import Foundation
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
    
    var isPeripheralReady = false
    
    var message: String = ""
    
    @objc func start(_ options: Dictionary<String, String>,
                     resolve: RCTPromiseResolveBlock,
                     reject: RCTPromiseRejectBlock
    ) -> Void {
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
                                 reject: RCTPromiseRejectBlock
    ) -> Void {
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
        
        self.preparePeripheral(serviceUUID: serviceUUID, characteristicUUID: characteristicUUID)
        
        resolve(nil)
    }
    
    @objc func advertise(_ options: Dictionary<String, String>,
                        resolve: RCTPromiseResolveBlock,
                        reject: RCTPromiseRejectBlock
    ) -> Void {
        guard peripheralManager != nil else {
            reject("error", "Uninitialized, call `start()` first", nil)
            return
        }
        
        guard service != nil else {
            reject("error", "Service not set!", nil)
            return
        }
        
        self.advertise()
        
        resolve(nil)
    }
    
    @objc func notify(_ message: String,
                      resolve: RCTPromiseResolveBlock,
                      reject: RCTPromiseRejectBlock
    ) -> Void {
        guard peripheralManager != nil || characteristic != nil else {
            reject("error", "Uninitialized, call `start()` first", nil)
            return
        }

        guard let data = message.data(using: .utf8) else {
            reject("error", "Could not convert data to bytes. Invalid UTF-8 encoding?", nil)
            return
        }
        
        self.notify(data: data)
        
        resolve(nil)
    }
    
    @objc func scan(_ options: Dictionary<String, String>,
                    resolve: RCTPromiseResolveBlock,
                    reject: RCTPromiseRejectBlock
    ) -> Void {
        guard centralManager != nil else {
            reject("error", "Uninitialized, call `start()` first", nil)
            return
        }
        
        self.scan()
        
        resolve(nil)
    }
    
    @objc func connect(_ peripheralId: String,
                       resolve: RCTPromiseResolveBlock,
                       reject: RCTPromiseRejectBlock
    ) -> Void {
        guard  centralManager != nil else {
            reject("error", "Uninitialized, call `start()` first", nil)
            return
        }
        
        guard UUID(uuidString: peripheralId) != nil else {
            reject("error", "peripheralId `" + peripheralId + "` is not a UUID", nil)
            return
        }
        
        guard let peripheral = self.findPeripheralById(peripheralId: peripheralId) else {
            reject("error", "peripheralId `" + peripheralId + "` could not be found.", nil)
            return
        }
        
        self.connect(peripheral: peripheral)
        
        resolve(nil)
    }
    
    @objc func write(_ peripheralId: String,
                     message: String,
                     resolve: RCTPromiseResolveBlock,
                     reject: RCTPromiseRejectBlock
    ) -> Void {
        guard  centralManager != nil else {
            reject("error", "Uninitialized, call `start()` first", nil)
            return
        }
        
        guard UUID(uuidString: peripheralId) != nil else {
            reject("error", "peripheralId `" + peripheralId + "` is not a UUID", nil)
            return
        }
        
        guard let peripheral = self.findPeripheralById(peripheralId: peripheralId) else {
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
        
        self.write(peripheral: peripheral, message: data)
        
        resolve(nil)
    }
}
