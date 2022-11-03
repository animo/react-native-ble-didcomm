import CoreBluetooth
import Foundation
import os

extension PeripheralManager: CBPeripheralManagerDelegate {
  func peripheralManagerDidUpdateState(_ peripheral: CBPeripheralManager) {
    switch peripheral.state {
    case .poweredOn:
      isPoweredOn = true
    default:
      os_log("other...")
    }
  }

  func peripheralManagerIsReady(toUpdateSubscribers _: CBPeripheralManager) {
    os_log("Central is ready again! let's send some stuff!")
    isCentralReady = true
  }

  func peripheralManager(
    _ peripheral: CBPeripheralManager, didReceiveWrite requests: [CBATTRequest]
  ) {
    for aRequest in requests {
      guard let requestValue = aRequest.value else {
        peripheral.respond(to: aRequest, withResult: CBATTError.unlikelyError)
        continue
      }
      peripheral.respond(to: aRequest, withResult: CBATTError.success)

      if String(data: requestValue, encoding: .utf8) == "EOM" {
        sendEvent(
          "onReceivedWriteWithoutResponse",
          ["message": String(data: receivedMessage ?? Data(), encoding: .utf8)])
        receivedMessage = nil
      } else {
        if receivedMessage == nil {
          receivedMessage = requestValue
        } else {
          receivedMessage?.append(requestValue)
        }
      }
    }
  }

  func peripheralManager(
    _: CBPeripheralManager, central: CBCentral, didSubscribeTo _: CBCharacteristic
  ) {
    guard connectedCentral == nil else {
      os_log("Already connected to a single central")
      return
    }
    connectedCentral = central
  }
}
