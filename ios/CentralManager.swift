import CoreBluetooth
import Foundation
import os

class CentralManager: NSObject {
  public enum CentralManagerError: Error {
    case PeripheralNotFound(peripheralId: String)
    case NotConnectedToPeripheral
    case NoWriteableCharacteristicFound
  }

  var serviceUUID: CBUUID
  var characteristicUUID: CBUUID
  var notifyCharacteristicUUID: CBUUID

  var centralManager: CBCentralManager!

  var peripherals: [CBPeripheral] = []

  var characterisitc: CBCharacteristic?
  var connectedPeripheral: CBPeripheral?
  var isPeripheralReady: Bool = true
  var sendEvent: (_ withName: String?, _ body: Any?) -> Void

  var receivedMessage: Data?

  init(
    sendEvent: @escaping (_ withName: String?, _ body: Any?) -> Void,
    serviceUUID: String,
    characteristicUUID: String,
    notifyCharacteristicUUID: String
  ) {
    self.sendEvent = sendEvent
    self.serviceUUID = CBUUID(string: serviceUUID)
    self.characteristicUUID = CBUUID(string: characteristicUUID)
    self.notifyCharacteristicUUID = CBUUID(string: notifyCharacteristicUUID)

    super.init()
    self.centralManager = CBCentralManager(
      delegate: self,
      queue: nil,
      options: [CBCentralManagerOptionShowPowerAlertKey: true]
    )
  }

  private func findPeripheralsByid(peripheralId: String) -> CBPeripheral? {
    return peripherals.first(where: { $0.identifier.uuidString == peripheralId })
  }

  func scan() {
    centralManager.scanForPeripherals(
      withServices: [serviceUUID], options: [CBCentralManagerScanOptionAllowDuplicatesKey: false])
  }

  func stopScan() {
    centralManager.stopScan()
  }

  func connect(peripheralId: String) throws {
    guard let peripheral = self.findPeripheralsByid(peripheralId: peripheralId) else {
      throw CentralManagerError.PeripheralNotFound(peripheralId: peripheralId)
    }

    centralManager.connect(peripheral)
  }

  func write(message: Data) throws {
    guard let peripheral = connectedPeripheral else {
      throw CentralManagerError.NotConnectedToPeripheral
    }
    guard let characteristic = characterisitc else {
      throw CentralManagerError.NoWriteableCharacteristicFound
    }

    let mtu = peripheral.maximumWriteValueLength(for: CBCharacteristicWriteType.withResponse)
    let chunkSize = min(mtu, message.count)
    for chunkIndexStart in stride(from: 0, to: message.count, by: chunkSize) {
      let chunkIndexEnd = min(chunkIndexStart + chunkSize, message.count) - 1
      let chunkedMessage = message[chunkIndexStart...chunkIndexEnd]
      while !isPeripheralReady { Thread.sleep(forTimeInterval: 0.05) }
      peripheral.writeValue(chunkedMessage, for: characteristic, type: .withResponse)
    }
    while !isPeripheralReady { Thread.sleep(forTimeInterval: 0.05) }
    peripheral.writeValue(
      "EOM".data(using: String.Encoding.utf8)!, for: characteristic, type: .withResponse)
  }
}
