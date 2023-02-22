import CoreBluetooth
import Foundation
import os

extension PeripheralManager: CBPeripheralManagerDelegate {
  func peripheralManagerDidUpdateState(_ peripheral: CBPeripheralManager) {
    switch peripheral.state {
    case .poweredOn:
      isPoweredOn = true
    default:
      os_log("Unknown state")
    }
  }

  func peripheralManagerIsReady(toUpdateSubscribers _: CBPeripheralManager) {
    isCentralReady = true
  }

  func peripheralManager(_ peripheral: CBPeripheralManager, central: CBCentral, didUnsubscribeFrom characteristic: CBCharacteristic) {
    connectedCentral = nil
    sendEvent("onDisconnectedCentral", ["identifier": central.identifier.uuidString ])
  }

  func peripheralManager(
    _ peripheral: CBPeripheralManager, central: CBCentral,
    didSubscribeTo characteristic: CBCharacteristic
  ) {
    guard connectedCentral == nil else {
      os_log("Error already connected to a single central")
      return
    }
    sendEvent("onConnectedCentral", ["identifier": central.identifier.uuidString ])
    connectedCentral = central
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
}
