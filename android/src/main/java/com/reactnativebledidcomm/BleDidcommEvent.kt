package com.reactnativebledidcomm

enum class BleDidcommEvent(val token: String) {
    OnDiscoverPeripheral("onDiscoverPeripheral"),
    OnConnectedPeripheral("onConnectedPeripheral"),
    OnConnectedCentral("onConnectedCentral"),
    OnReceivedWriteWithoutResponse("onReceivedWriteWithoutResponse"),
    OnReceivedNotification("onReceivedNotification"),
    OnDisconnectedPeripheral("onDisconnectedPeripheral"),
    OnDisconnectedCentral("onDisconnectedCentral")
}
