import Foundation

extension BleDidcommSdk {
    open override func supportedEvents() -> [String] {
      ["onDiscoverPeripheral", "onConnectedPeripheral", "onReceivedWriteWithoutResponse", "onReceivedNotification"]
    }
}
