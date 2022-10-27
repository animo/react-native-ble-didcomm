import CoreBluetooth
import Foundation
import os

extension BleDidcommSdk {
    func findPeripheralById(peripheralId: String) -> CBPeripheral? {
        return peripherals.first(where: { $0.identifier.uuidString == peripheralId })
    }

    func scan() {
        let centralManager = centralManager.unsafelyUnwrapped
        let service = service.unsafelyUnwrapped

        centralManager.scanForPeripherals(withServices: [service.uuid], options: [CBCentralManagerScanOptionAllowDuplicatesKey: false])
    }

    func connect(peripheral: CBPeripheral) {
        let centralManager = centralManager.unsafelyUnwrapped

        centralManager.connect(peripheral)
    }

    func write(peripheral: CBPeripheral, message: Data) {
        let sendableCharacteristic = sendableCharacteristic.unsafelyUnwrapped

        let mtu = peripheral.maximumWriteValueLength(for: .withResponse)
        let chunkSize = min(mtu, message.count)
        for i in stride(from: 0, to: message.count, by: chunkSize) {
            let chunkIndexStart = i
            let chunkIndexEnd = min(chunkIndexStart + chunkSize, message.count - 1)
            let chunkedMessage = message[chunkIndexStart ... chunkIndexEnd]
            peripheral.writeValue(chunkedMessage, for: sendableCharacteristic, type: .withResponse)
        }
        peripheral.writeValue("EOM".data(using: String.Encoding.utf8)!, for: sendableCharacteristic, type: .withResponse)
    }
}
