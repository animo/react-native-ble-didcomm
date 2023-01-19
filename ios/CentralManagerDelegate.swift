import CoreBluetooth
import Foundation
import os

extension CentralManager: CBCentralManagerDelegate {
  func centralManagerDidUpdateState(_ cm: CBCentralManager) {}

  func centralManager(
    _: CBCentralManager, didDiscover peripheral: CBPeripheral, advertisementData _: [String: Any],
    rssi _: NSNumber
  ) {
    peripherals.append(peripheral)
    sendEvent(
      "onDiscoverPeripheral",
      ["peripheralId": peripheral.identifier.uuidString, "name": peripheral.name])
  }

  func centralManager(_ central: CBCentralManager, didConnect peripheral: CBPeripheral) {
    sendEvent("onConnectedPeripheral", ["peripheralId": peripheral.identifier.uuidString])
    peripheral.delegate = self
    peripheral.discoverServices([serviceUUID.unsafelyUnwrapped])
    connectedPeripheral = peripheral
    stopScan()
  }

  func centralManager(_ central: CBCentralManager, didDisconnect peripheral: CBPeripheral) {
    connectedPeripheral = nil
  }
}
