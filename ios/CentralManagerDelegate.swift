import Foundation
import CoreBluetooth
import os

extension BleDidcommSdk: CBCentralManagerDelegate {
    func centralManagerDidUpdateState(_ central: CBCentralManager) {}

    func centralManager(_ central: CBCentralManager, didDiscover peripheral: CBPeripheral, advertisementData: [String : Any], rssi RSSI: NSNumber) {
        peripherals.append(peripheral)
        sendEvent(withName: "onDiscoverPeripheral", body: ["peripheralId": peripheral.identifier.uuidString, "name": peripheral.name ])
    }

    func centralManager(_ central: CBCentralManager, didConnect peripheral: CBPeripheral) {
        sendEvent(withName: "onConnectedPeripheral", body: ["peripheralId": peripheral.identifier.uuidString])
        central.stopScan()
        
        peripheral.delegate = self
        guard let service = service else { return }
        peripheral.discoverServices([service.uuid])
    }
}
