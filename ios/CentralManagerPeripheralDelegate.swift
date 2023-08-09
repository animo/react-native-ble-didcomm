import CoreBluetooth
import os

extension CentralManager: CBPeripheralDelegate {
  func peripheral(
    _ peripheral: CBPeripheral, didDiscoverCharacteristicsFor service: CBService, error: Error?
  ) {
    if let error = error {
      os_log("Error discovering characteristics: %s", error.localizedDescription)
      return
    }
    guard let characteristics = service.characteristics else { return }
    self.service = service

    let indicationCharacteristicUUID = characteristics.first(where: {
      $0.uuid == self.indicationCharacteristicUUID
    })
    let writeCharacteristic = characteristics.first(where: {
      $0.uuid == self.writeCharacteristicUUID
    })

    if let indicationCharacteristicUUID = indicationCharacteristicUUID {
      peripheral.setNotifyValue(true, for: indicationCharacteristicUUID)
    }
    self.writeCharacteristic = writeCharacteristic
  }

  func peripheral(_ peripheral: CBPeripheral, didModifyServices invalidatedServices: [CBService]) {
    if invalidatedServices.first(where: { $0.uuid == serviceUUID }) != nil {
      os_log("Disconnecting from peripheral")
      sendEvent("onDisconnectedPeripheral", ["identifier": peripheral.identifier.uuidString])
      centralManager.cancelPeripheralConnection(peripheral)
    }
  }

  func peripheral(_ peripheral: CBPeripheral, didDiscoverServices error: Error?) {
    if let error = error {
      os_log("Error discovering services: %s", error.localizedDescription)
      return
    }

    guard let peripheralServices = peripheral.services else { return }
    for service in peripheralServices {
      peripheral.discoverCharacteristics(
        [
          writeCharacteristicUUID.unsafelyUnwrapped,
          indicationCharacteristicUUID.unsafelyUnwrapped
        ], for: service)
    }
  }

  func peripheral(
    _: CBPeripheral, didUpdateValueFor characteristic: CBCharacteristic, error: Error?
  ) {
    if let error = error {
      os_log("Error updating value for characteristic: %s", error.localizedDescription)
      return
    }

    guard let data = characteristic.value else { return }

    if String(data: data, encoding: .utf8) == "EOM" {
      sendEvent(
        "onReceivedNotification",
        ["message": String(data: receivedMessage ?? Data(), encoding: .utf8)])
      receivedMessage = nil
    } else {
      if receivedMessage == nil {
        receivedMessage = data
      } else {
        receivedMessage?.append(data)
      }
    }
  }
}
