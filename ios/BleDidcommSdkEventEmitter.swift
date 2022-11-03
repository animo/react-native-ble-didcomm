import Foundation

extension BleDidcommSdk {
  override open func supportedEvents() -> [String] {
    [
      "onDiscoverPeripheral", "onConnectedPeripheral", "onReceivedWriteWithoutResponse",
      "onReceivedNotification",
    ]
  }
}
