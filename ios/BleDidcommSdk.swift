import CoreBluetooth
import Foundation
import React
import os

@objc(BleDidcommSdk)
class BleDidcommSdk: React.RCTEventEmitter {
  var peripheralManager: PeripheralManager?
  var centralManager: CentralManager?

  @objc func startPeripheral(
    _ serviceUUID: String,
    writeCharacteristicUUID: String,
    indicationCharacteristicUUID: String,
    resolve: RCTPromiseResolveBlock,
    reject _: RCTPromiseRejectBlock
  ) {
    peripheralManager = PeripheralManager(
      sendEvent: self.sendEvent,
      serviceUUID: serviceUUID,
      writeCharacteristicUUID: writeCharacteristicUUID,
      indicationCharacteristicUUID: indicationCharacteristicUUID
    )
    resolve(nil)
  }

  @objc func startCentral(
    _ serviceUUID: String,
    writeCharacteristicUUID: String,
    indicationCharacteristicUUID: String,
    resolve: RCTPromiseResolveBlock,
    reject: RCTPromiseRejectBlock
  ) {
    centralManager = CentralManager(
      sendEvent: self.sendEvent,
      serviceUUID: serviceUUID,
      writeCharacteristicUUID: writeCharacteristicUUID,
      indicationCharacteristicUUID: indicationCharacteristicUUID
    )
    resolve(nil)
  }

  @objc func advertise(
    _: [String: String],
    resolve: RCTPromiseResolveBlock,
    reject: RCTPromiseRejectBlock
  ) {
    guard let peripheralManager = self.peripheralManager else {
      reject("error", "Uninitialized, call `startPeripheral()` first", nil)
      return
    }

    peripheralManager.advertise()

    resolve(nil)
  }

  @objc func indicate(
    _ message: String,
    resolve: RCTPromiseResolveBlock,
    reject: RCTPromiseRejectBlock
  ) {
    guard let peripheralManager = peripheralManager else {
      reject("error", "Uninitialized, call `startPeripheral()` first", nil)
      return
    }

    guard let data = message.data(using: .utf8) else {
      reject("error", "Message is not a valid UTF-8 encoded string", nil)
      return
    }

    do {
      try peripheralManager.indicate(message: data)
      resolve(nil)
    } catch PeripheralManager.PeripheralManagerError.NotConnectedToCentral {
      reject("error", "Not connected to any central", nil)
    } catch {
      reject("error", "unexpected error", nil)
    }
  }

  @objc func scan(
    _: [String: String],
    resolve: RCTPromiseResolveBlock,
    reject: RCTPromiseRejectBlock
  ) {
    guard let centralManager = self.centralManager else {
      reject("error", "Uninitialized, call `startCentral()` first", nil)
      return
    }

    centralManager.scan()

    resolve(nil)
  }

  @objc func connect(
    _ peripheralId: String,
    resolve: RCTPromiseResolveBlock,
    reject: RCTPromiseRejectBlock
  ) {
    guard let centralManager = self.centralManager else {
      reject("error", "Uninitialized, call `startCentral()` first", nil)
      return
    }

    do {
      try centralManager.connect(peripheralId: peripheralId)
      resolve(nil)
    } catch CentralManager.CentralManagerError.PeripheralNotFound(let peripheralId) {
      reject("error", "Peripheral not found with id: \(peripheralId)", nil)
    } catch {
      reject("error", "unexpected error", nil)
    }
  }

  @objc func write(
    _ message: String,
    resolve: RCTPromiseResolveBlock,
    reject: RCTPromiseRejectBlock
  ) {
    guard let centralManager = self.centralManager else {
      reject("error", "Uninitialized, call `startCentral()` first", nil)
      return
    }

    guard let data = message.data(using: .utf8) else {
      reject("error", "Message is not a valid UTF-8 encoded string", nil)
      return
    }

    do {
      try centralManager.write(message: data)
      resolve(nil)
    } catch CentralManager.CentralManagerError.NotConnectedToPeripheral {
      reject("error", "Not connected to any peripheral", nil)
    } catch CentralManager.CentralManagerError.NoWriteableCharacteristicFound {
      reject("error", "No writeable characteristic found", nil)
    } catch {
      reject("error", "unexpected error", nil)
    }
  }
}
