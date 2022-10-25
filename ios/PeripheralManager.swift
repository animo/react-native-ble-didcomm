import Foundation
import CoreBluetooth

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
    
    func notify(data: Data) {
        let peripheralManager = peripheralManager.unsafelyUnwrapped
        let characteristic = characteristic.unsafelyUnwrapped
        
        peripheralManager.updateValue(data, for: characteristic, onSubscribedCentrals: nil)
    }
}
