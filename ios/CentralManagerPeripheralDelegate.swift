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

    let notifyCharacteristic = characteristics.first(where: { $0.uuid == notifyCharacteristicUUID })
    let characteristic = characteristics.first(where: { $0.uuid == characteristicUUID })

    if let notifyCharacteristic = notifyCharacteristic {
      peripheral.setNotifyValue(true, for: notifyCharacteristic)
    }
    if let characteristic = characteristic {
      self.writeCharacteristic = characteristic
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
        [characteristicUUID, notifyCharacteristicUUID], for: service)
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
