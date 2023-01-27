package com.reactnativebledidcomm

enum class BleDidcommEvent(val token: String) {
    OnDiscoverPeripheral("onDiscoverPeripheral"),
    OnConnectedPeripheral("onConnectedPeripheral"),
    OnConnectedCentral("OnConnectedCentral"),
    OnReceivedWriteWithoutResponse("onReceivedWriteWithoutResponse"),
    OnReceivedNotification("onReceivedNotification"),
    OnDisconnectedPeripheral("OnDisconnectedPeripheral"),
    OnDisconnectedCentral("OnDisconnectedCentral")
}
