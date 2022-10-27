import CoreBluetooth
import Foundation
import os

extension BleDidcommSdk {
    func advertise() {
        let peripheralManager = peripheralManager.unsafelyUnwrapped
        let service = service.unsafelyUnwrapped

        peripheralManager.startAdvertising([CBAdvertisementDataServiceUUIDsKey: [service.uuid]])
    }

    func preparePeripheral(serviceUUID: String, characteristicUUID: String) {
        let peripheralManager = peripheralManager.unsafelyUnwrapped
        let characteristic = CBMutableCharacteristic(type: CBUUID(string: characteristicUUID),
                                                     properties: [.notify, .write],
                                                     value: nil,
                                                     permissions: [.readable, .writeable])

        let service = CBMutableService(type: CBUUID(string: serviceUUID), primary: true)
        service.characteristics = [characteristic]
        peripheralManager.add(service)
        self.service = service
        self.characteristic = characteristic
    }

    func notify(message: Data) {
        let peripheralManager = peripheralManager.unsafelyUnwrapped
        let characteristic = characteristic.unsafelyUnwrapped
        let connectedCentral = connectedCentral.unsafelyUnwrapped

        let mtu = connectedCentral.maximumUpdateValueLength
        let chunkSize = min(mtu, message.count)

        for i in stride(from: 0, to: message.count, by: chunkSize) {
            let chunkIndexStart = i
            let chunkIndexEnd = min(chunkIndexStart + chunkSize, message.count - 1)
            let chunkedMessage = message[chunkIndexStart ... chunkIndexEnd]
            while !isPeripheralReady { Thread.sleep(forTimeInterval: 0.05) }
            isPeripheral = peripheralManager.updateValue(chunkedMessage, for: characteristic, onSubscribedCentrals: [connectedCentral])
        }
        while !isPeripheralReady { Thread.sleep(forTimeInterval: 0.05) }
        peripheralManager.updateValue("EOM".data(using: String.Encoding.utf8)!, for: characteristic, onSubscribedCentrals: [connectedCentral])
    }
}
