import CoreBluetooth
import Foundation
import os

class CentralManager: NSObject {
  public enum CentralManagerError: Error {
    case peripheralNotFound(peripheralId: String)
    case notConnectedToPeripheral
    case noWriteableCharacteristicFound
    case noDefinedService
  }

  var serviceUUID: CBUUID?
  var writeCharacteristicUUID: CBUUID?
  var indicationCharacteristicUUID: CBUUID?
  var service: CBService?

  var centralManager: CBCentralManager!

  var peripherals: [CBPeripheral] = []

  var writeCharacteristic: CBCharacteristic?
  var connectedPeripheral: CBPeripheral?
  var isPeripheralReady: Bool = true
  var sendEvent: (_ withName: String?, _ body: Any?) -> Void

  var receivedMessage: Data?

  init(sendEvent: @escaping (_ withName: String?, _ body: Any?) -> Void) {
    self.sendEvent = sendEvent

    super.init()
    self.centralManager = CBCentralManager(
      delegate: self,
      queue: .main
    )

    while centralManager.state == .unknown { Thread.sleep(forTimeInterval: 0.05) }
  }

  func shutdownCentral() {
    let indicationCharacteristicUUID = self.service?.characteristics?.first(where: {
      $0.uuid == self.indicationCharacteristicUUID
    })

    if let indicationCharacteristicUUID = indicationCharacteristicUUID {
      connectedPeripheral?.setNotifyValue(false, for: indicationCharacteristicUUID)
    }

    if let connectedPeripheral = self.connectedPeripheral {
      self.centralManager.cancelPeripheralConnection(connectedPeripheral)
    }

    if self.centralManager.isScanning {
      self.stopScan()
    }

    self.peripherals = []
    self.writeCharacteristic = nil
    self.connectedPeripheral = nil
    self.receivedMessage = nil
    self.serviceUUID = nil
    self.writeCharacteristicUUID = nil
    self.indicationCharacteristicUUID = nil
  }

  func setService(
    serviceUUID: String,
    writeCharacteristicUUID: String,
    indicationCharacteristicUUID: String
  ) {
    self.serviceUUID = CBUUID(string: serviceUUID)
    self.writeCharacteristicUUID = CBUUID(string: writeCharacteristicUUID)
    self.indicationCharacteristicUUID = CBUUID(string: indicationCharacteristicUUID)
  }

  private func findPeripheralsByid(peripheralId: String) -> CBPeripheral? {
    return peripherals.first(where: { $0.identifier.uuidString == peripheralId })
  }

  func scan() throws {
    guard let serviceUUID = self.serviceUUID else {
      throw CentralManagerError.noDefinedService
    }

    self.centralManager.scanForPeripherals(
      withServices: [serviceUUID],
      options: [CBCentralManagerScanOptionAllowDuplicatesKey: false])

  }

  func stopScan() {
    centralManager.stopScan()
  }

  func connect(peripheralId: String) throws {
    guard let peripheral = self.findPeripheralsByid(peripheralId: peripheralId) else {
      throw CentralManagerError.peripheralNotFound(peripheralId: peripheralId)
    }

    centralManager.connect(peripheral)
  }

  func write(message: Data) throws {
    guard let peripheral = connectedPeripheral else {
      throw CentralManagerError.notConnectedToPeripheral
    }
    guard let characteristic = writeCharacteristic else {
      throw CentralManagerError.noWriteableCharacteristicFound
    }

    let mtu = peripheral.maximumWriteValueLength(for: CBCharacteristicWriteType.withResponse)
    let chunkSize = min(mtu - Constants.numberOfBytesForHeader, message.count)
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
