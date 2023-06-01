import CoreBluetooth
import Foundation
import os

class PeripheralManager: NSObject {
  public enum PeripheralManagerError: Error {
    case NotConnectedToCentral
    case NoDefinedService
  }

  var isPoweredOn: Bool = false
  var service: CBMutableService?
  var writeCharacteristic: CBMutableCharacteristic?
  var indicationCharacteristic: CBMutableCharacteristic?

  var peripheralManager: CBPeripheralManager!

  var connectedCentral: CBCentral?
  var isCentralReady: Bool = true

  var sendEvent: (_ withName: String?, _ body: Any?) -> Void

  var receivedMessage: Data?

  init(sendEvent: @escaping (_ withName: String?, _ body: Any?) -> Void) {
    self.sendEvent = sendEvent
    super.init()
    self.peripheralManager = CBPeripheralManager(
      delegate: self,
      queue: nil,
      options: [CBPeripheralManagerOptionShowPowerAlertKey: true]
    )

    while !isPoweredOn { Thread.sleep(forTimeInterval: 0.05) }
  }

  func stopPeripheral() {
    do {
      self.stopAdvertise()
    } catch {
      // Not advertising - do nothing
    }
    self.service = nil
    self.writeCharacteristic = nil
    self.indicationCharacteristic = nil
    self.peripheralManager.removeAllServices()
  }

  func setService(
    serviceUUID: String, writeCharacteristicUUID: String, indicationCharacteristicUUID: String
  ) throws {
    self.service = CBMutableService(type: CBUUID(string: serviceUUID), primary: true)
    self.writeCharacteristic = CBMutableCharacteristic(
      type: CBUUID(string: writeCharacteristicUUID), properties: [.write], value: nil,
      permissions: [.writeable])
    self.indicationCharacteristic = CBMutableCharacteristic(
      type: CBUUID(string: indicationCharacteristicUUID), properties: [.indicate], value: nil,
      permissions: [.writeable])
    guard let wc = self.writeCharacteristic, let ic = self.indicationCharacteristic,
      let s = self.service
    else {
      throw PeripheralManagerError.NotConnectedToCentral
    }

    s.characteristics = [wc, ic]
    self.peripheralManager.add(s)
  }

  func advertise() throws {
    guard let service = self.service else {
      throw PeripheralManagerError.NoDefinedService
    }
    self.peripheralManager.startAdvertising([CBAdvertisementDataServiceUUIDsKey: [service.uuid]])
  }

  func stopAdvertise() throws {
    guard let service = self.service else {
      throw PeripheralManagerError.NoDefinedService
    }
    self.peripheralManager.stopAdvertising()
  } 

  func indicate(message: Data) throws {
    guard let connectedCentral = connectedCentral else {
      throw PeripheralManagerError.NotConnectedToCentral
    }
    guard let indicationCharacteristic = self.indicationCharacteristic else {
      throw PeripheralManagerError.NoDefinedService
    }

    let mtu = connectedCentral.maximumUpdateValueLength
    let chunkSize = min(mtu - Constants.NUMBER_OF_BYTES_FOR_DATA_HEADER, message.count)

    for chunkIndexStart in stride(from: 0, to: message.count, by: chunkSize) {
      let chunkIndexEnd = min(chunkIndexStart + chunkSize, message.count) - 1
      let chunkedMessage = message[chunkIndexStart...chunkIndexEnd]
      isCentralReady = self.peripheralManager.updateValue(
        chunkedMessage, for: indicationCharacteristic, onSubscribedCentrals: [connectedCentral])
      if !isCentralReady {
        while !isCentralReady { Thread.sleep(forTimeInterval: 0.05) }
        self.peripheralManager.updateValue(
          chunkedMessage, for: indicationCharacteristic, onSubscribedCentrals: [connectedCentral])
      }
    }
    isCentralReady = self.peripheralManager.updateValue(
      "EOM".data(using: String.Encoding.utf8)!, for: indicationCharacteristic,
      onSubscribedCentrals: [connectedCentral])
    if !isCentralReady {
      while !isCentralReady { Thread.sleep(forTimeInterval: 0.05) }
      self.peripheralManager.updateValue(
        "EOM".data(using: String.Encoding.utf8)!, for: indicationCharacteristic,
        onSubscribedCentrals: [connectedCentral])
    }
  }
}
