import CoreBluetooth
import Foundation
import os

class PeripheralManager: NSObject {
  public enum PeripheralManagerError: Error {
    case notConnectedToCentral
    case noDefinedService
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
      queue: .main
    )

    while !isPoweredOn { Thread.sleep(forTimeInterval: 0.05) }
  }

  func shutdownPeripheral() {
    if self.peripheralManager.isAdvertising {
      self.stopAdvertising()
    }

    self.service = nil
    self.writeCharacteristic = nil
    self.indicationCharacteristic = nil
    self.peripheralManager.removeAllServices()
  }

  func setService(
    serviceUUID: String, writeCharacteristicUUID: String, indicationCharacteristicUUID: String
  ) {
    let wc = CBMutableCharacteristic(
      type: CBUUID(string: writeCharacteristicUUID), properties: [.write], value: nil,
      permissions: [.writeable])

    let ic = CBMutableCharacteristic(
      type: CBUUID(string: indicationCharacteristicUUID), properties: [.indicate], value: nil,
      permissions: [.readable])

    let s = CBMutableService(type: CBUUID(string: serviceUUID), primary: true)
    s.characteristics = [wc, ic]

    self.service = s
    self.indicationCharacteristic = ic
    self.writeCharacteristic = wc
    self.peripheralManager.add(s)
  }

  func advertise() throws {
    guard let service = self.service else {
      throw PeripheralManagerError.noDefinedService
    }
    self.peripheralManager.startAdvertising([CBAdvertisementDataServiceUUIDsKey: [service.uuid]])
  }

  func stopAdvertising() {
    self.peripheralManager.stopAdvertising()
  }

  func indicate(message: Data) throws {
    guard let connectedCentral = connectedCentral else {
      throw PeripheralManagerError.notConnectedToCentral
    }
    guard let indicationCharacteristic = self.indicationCharacteristic else {
      throw PeripheralManagerError.noDefinedService
    }

    let mtu = connectedCentral.maximumUpdateValueLength
    let chunkSize = min(mtu - Constants.numberOfBytesForHeader, message.count)

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
