import Foundation
import CoreBluetooth
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
    
    func peripheralManagerIsReady(toUpdateSubscribers peripheral: CBPeripheralManager) {
        isPeripheralReady = true
        os_log("peripheral is ready to receive again!")
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
    
    func peripheral(_ peripheral: CBPeripheral, didDiscoverCharacteristicsFor service: CBService, error: Error?) {
        if let error = error {
            os_log("Error discovering characteristics: %s", error.localizedDescription)
            return
        }
        
        guard let serviceCharacteristics = service.characteristics, let c = self.characteristic else { return }
        for characteristic in serviceCharacteristics where characteristic.uuid == c.uuid {
            os_log("woo")
            self.sendableCharacteristic = characteristic
            peripheral.setNotifyValue(true, for: characteristic)
        }
    }
    
    func peripheral(_ peripheral: CBPeripheral, didUpdateValueFor characteristic: CBCharacteristic, error: Error?) {
        if let error = error {
            os_log("Error updating value for characteristic: %s", error.localizedDescription)
            return
        }
        guard let message = characteristic.value else { return }
        sendEvent(withName: "onReceivedNotification", body: ["message": String(data: message, encoding: String.Encoding.utf8)])
    }
}
