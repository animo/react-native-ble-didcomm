import CoreBluetooth
import Foundation
import os

class PeripheralManager: NSObject {
  public enum PeripheralManagerError: Error {
    case NotConnectedToCentral
  }

  var isPoweredOn: Bool = false
  var service: CBMutableService
  var characteristic: CBMutableCharacteristic
  var notifyCharacteristic: CBMutableCharacteristic

  var peripheralManager: CBPeripheralManager!

  var connectedCentral: CBCentral?
  var isCentralReady: Bool = true

  var sendEvent: (_ withName: String?, _ body: Any?) -> Void

  var receivedMessage: Data?

  init(
    sendEvent: @escaping (_ withName: String?, _ body: Any?) -> Void,
    serviceUUID: String,
    characteristicUUID: String,
    notifyCharacteristicUUID: String
  ) {
    self.sendEvent = sendEvent
    self.service = CBMutableService(type: CBUUID(string: serviceUUID), primary: true)
    self.characteristic = CBMutableCharacteristic(
      type: CBUUID(string: characteristicUUID), properties: [.write], value: nil,
      permissions: [.writeable])
    self.notifyCharacteristic = CBMutableCharacteristic(
      type: CBUUID(string: notifyCharacteristicUUID), properties: [.indicate], value: nil,
      permissions: [.writeable])

    super.init()
    self.peripheralManager = CBPeripheralManager(
      delegate: self,
      queue: nil,
      options: [CBPeripheralManagerOptionShowPowerAlertKey: true]
    )
    self.service.characteristics = [characteristic, notifyCharacteristic]
    while !isPoweredOn { Thread.sleep(forTimeInterval: 0.05) }
    self.peripheralManager.removeAllServices()
    self.peripheralManager.add(self.service)
  }

  func advertise() {
    self.peripheralManager.startAdvertising([CBAdvertisementDataServiceUUIDsKey: [service.uuid]])
  }

  func notify(message: Data) throws {
    guard let connectedCentral = connectedCentral else {
      throw PeripheralManagerError.NotConnectedToCentral
    }

    let mtu = connectedCentral.maximumUpdateValueLength
    let chunkSize = min(mtu, message.count)

    for chunkIndexStart in stride(from: 0, to: message.count, by: chunkSize) {
      let chunkIndexEnd = min(chunkIndexStart + chunkSize, message.count) - 1
      let chunkedMessage = message[chunkIndexStart...chunkIndexEnd]
      isCentralReady = self.peripheralManager.updateValue(
        chunkedMessage, for: notifyCharacteristic, onSubscribedCentrals: [connectedCentral])
      if !isCentralReady {
        while !isCentralReady { Thread.sleep(forTimeInterval: 0.05) }
        self.peripheralManager.updateValue(
          chunkedMessage, for: notifyCharacteristic, onSubscribedCentrals: [connectedCentral])
      }
    }
    isCentralReady = self.peripheralManager.updateValue(
      "EOM".data(using: String.Encoding.utf8)!, for: notifyCharacteristic,
      onSubscribedCentrals: [connectedCentral])
    if !isCentralReady {
      while !isCentralReady { Thread.sleep(forTimeInterval: 0.05) }
      self.peripheralManager.updateValue(
        "EOM".data(using: String.Encoding.utf8)!, for: notifyCharacteristic,
        onSubscribedCentrals: [connectedCentral])
    }
  }
}
