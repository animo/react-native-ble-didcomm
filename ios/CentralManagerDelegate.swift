import CoreBluetooth
import Foundation
import os

extension CentralManager: CBCentralManagerDelegate {
    func centralManagerDidUpdateState(_ central: CBCentralManager) {
        switch central.state {
        case .poweredOn:
            isPoweredOn = true
        default:
            os_log("Unknown state")
        }
    }

  func centralManager(
    _: CBCentralManager, didDiscover peripheral: CBPeripheral, advertisementData _: [String: Any],
    rssi _: NSNumber
  ) {
    peripherals.append(peripheral)
    sendEvent(
      "onDiscoverPeripheral",
      ["identifier": peripheral.identifier.uuidString, "name": peripheral.name])
  }

  func centralManager(_ central: CBCentralManager, didConnect peripheral: CBPeripheral) {
    sendEvent("onConnectedPeripheral", ["identifier": peripheral.identifier.uuidString])
    peripheral.delegate = self
    peripheral.discoverServices([serviceUUID.unsafelyUnwrapped])
    connectedPeripheral = peripheral
    stopScan()
  }

  func centralManager(_ central: CBCentralManager, didDisconnect peripheral: CBPeripheral) {
    sendEvent("onDisconnectedPeripheral", ["identifier": peripheral.identifier.uuidString])
    connectedPeripheral = nil
  }
}
