import CoreBluetooth
import Foundation
import os

extension BleDidcommSdk: CBPeripheralManagerDelegate, CBPeripheralDelegate {
    func peripheralManagerDidUpdateState(_ peripheral: CBPeripheralManager) {
        switch peripheral.state {
        case .poweredOn:
            os_log("Bluetooth is powered on")
            return
        default:
            os_log("Unknown state")
            return
        }
    }

    func peripheralManager(_ peripheral: CBPeripheralManager, didReceiveWrite requests: [CBATTRequest]) {
        for aRequest in requests {
            guard let requestValue = aRequest.value, let stringFromData = String(data: requestValue, encoding: .utf8) else {
                peripheral.respond(to: aRequest, withResult: CBATTError.unlikelyError)
                continue
            }
            peripheral.respond(to: aRequest, withResult: CBATTError.success)

            // Detect the last message and emit the event
            if stringFromData == "EOM" {
                sendEvent(withName: "onReceivedWriteWithoutResponse", body: ["message": message])
                // Reset the message
                message = ""
            } else {
                // Message is not EOM
                message += stringFromData
            }
        }
    }

    func peripheralManagerIsReady(toUpdateSubscribers _: CBPeripheralManager) {
        isPeripheralReady = true
    }

    func peripheral(_ peripheral: CBPeripheral, didDiscoverServices error: Error?) {
        if let error = error {
            os_log("Error discovering services: %s", error.localizedDescription)
            return
        }

        guard let peripheralServices = peripheral.services, let characteristic = characteristic else { return }
        for service in peripheralServices {
            peripheral.discoverCharacteristics([characteristic.uuid], for: service)
        }
    }

    func peripheralManager(_: CBPeripheralManager, central: CBCentral, didSubscribeTo _: CBCharacteristic) {
        guard connectedCentral == nil else {
            os_log("Already connected to a single central")
            return
        }
        connectedCentral = central
    }

    func peripheral(_ peripheral: CBPeripheral, didDiscoverCharacteristicsFor service: CBService, error: Error?) {
        if let error = error {
            os_log("Error discovering characteristics: %s", error.localizedDescription)
            return
        }

        guard let serviceCharacteristics = service.characteristics, let c = characteristic else { return }
        for characteristic in serviceCharacteristics where characteristic.uuid == c.uuid {
            self.sendableCharacteristic = characteristic
            peripheral.setNotifyValue(true, for: characteristic)
        }
    }

    func peripheral(_: CBPeripheral, didUpdateValueFor characteristic: CBCharacteristic, error: Error?) {
        if let error = error {
            os_log("Error updating value for characteristic: %s", error.localizedDescription)
            return
        }

        guard let value = characteristic.value, let stringFromData = String(data: value, encoding: .utf8) else {
            os_log("SOMETHING UNEXPECTED HAPPENED!")
            return
        }

        // Detect the last message and emit the event
        if stringFromData == "EOM" {
            sendEvent(withName: "onReceivedNotification", body: ["message": message])
            // Reset the message
            message = ""
        } else {
            // Message is not EOM
            message += stringFromData
        }
    }
}
