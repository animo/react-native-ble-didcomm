import CoreBluetooth
import Foundation
import os

class PeripheralManager: NSObject {
  public enum PeripheralManagerError: Error {
    case NotConnectedToCentral
  }

  var isPoweredOn: Bool = false
  var service: CBMutableService
  var writeCharacteristic: CBMutableCharacteristic
  var indicationCharacteristic: CBMutableCharacteristic

  var peripheralManager: CBPeripheralManager!

  var connectedCentral: CBCentral?
  var isCentralReady: Bool = true

  var sendEvent: (_ withName: String?, _ body: Any?) -> Void

  var receivedMessage: Data?

  init(
    sendEvent: @escaping (_ withName: String?, _ body: Any?) -> Void,
    serviceUUID: String,
    writeCharacteristicUUID: String,
    indicationCharacteristicUUID: String
  ) {
    self.sendEvent = sendEvent
    self.service = CBMutableService(type: CBUUID(string: serviceUUID), primary: true)
    self.writeCharacteristic = CBMutableCharacteristic(
      type: CBUUID(string: writeCharacteristicUUID), properties: [.write], value: nil,
      permissions: [.writeable])
    self.indicationCharacteristic = CBMutableCharacteristic(
      type: CBUUID(string: indicationCharacteristicUUID), properties: [.indicate], value: nil,
      permissions: [.writeable])

    super.init()
    self.peripheralManager = CBPeripheralManager(
      delegate: self,
      queue: nil,
      options: [CBPeripheralManagerOptionShowPowerAlertKey: true]
    )
    self.service.characteristics = [writeCharacteristic, indicationCharacteristic]
    while !isPoweredOn { Thread.sleep(forTimeInterval: 0.05) }
    self.peripheralManager.removeAllServices()
    self.peripheralManager.add(self.service)
  }

  func advertise() {
    self.peripheralManager.startAdvertising([CBAdvertisementDataServiceUUIDsKey: [service.uuid]])
  }

  func indicate(message: Data) throws {
    guard let connectedCentral = connectedCentral else {
      throw PeripheralManagerError.NotConnectedToCentral
    }

    let mtu = connectedCentral.maximumUpdateValueLength
    let chunkSize = min(mtu, message.count)

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
