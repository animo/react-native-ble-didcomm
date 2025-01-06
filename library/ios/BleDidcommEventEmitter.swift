import Foundation

extension BleDidcomm {
  override open func supportedEvents() -> [String] {
    [
      "onDiscoverPeripheral", "onConnectedPeripheral", "onReceivedWriteWithoutResponse",
      "onReceivedNotification", "onDisconnectedPeripheral", "onDisconnectedCentral",
      "onConnectedCentral",
    ]
  }
}
