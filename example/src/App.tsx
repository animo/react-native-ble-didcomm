/* eslint-disable react-native/no-inline-styles */
import * as React from "react"
import {
  StyleSheet,
  View,
  Text,
  Button,
  PermissionsAndroid,
  Platform,
  NativeEventEmitter,
  NativeModules,
} from "react-native"
import {
  startCentral,
  startPeripheral,
  advertise,
  scan,
  connect,
  write,
  indicate,
} from "react-native-ble-didcomm-sdk"
import {
  DIDCOMM_SERVICE_UUID,
  MESSAGE_CHARACTERISTIC_UUID,
  NOTIFY_CHARACTERISTIC_UUID,
} from "./constants"
import { presentationMsg } from "./presentationMsg"

const bleDidcommSdkEmitter = new NativeEventEmitter(NativeModules.BleDidcommSdk)

const Spacer = () => <View style={{ height: 20, width: 20 }} />

const msg = JSON.stringify(presentationMsg)

const requestPermissions = async () => {
  await PermissionsAndroid.requestMultiple([
    "android.permission.ACCESS_FINE_LOCATION",
    "android.permission.BLUETOOTH_CONNECT",
    "android.permission.BLUETOOTH_SCAN",
    "android.permission.BLUETOOTH_ADVERTISE",
    "android.permission.ACCESS_COARSE_LOCATION",
  ])
}

export default function App() {
  const [isCentral, setIsCentral] = React.useState(false)
  const [isPeripheral, setIsPeripheral] = React.useState(false)
  const [peripheralId, setPeripheralId] = React.useState<string>()
  const [connected, setConnected] = React.useState(false)

  React.useEffect(() => {
    const onDiscoverPeripheralListener = bleDidcommSdkEmitter.addListener(
      "onDiscoverPeripheral",
      ({
        peripheralId: pId,
        name,
      }: {
        peripheralId: string
        name?: string
      }) => {
        console.log(`Discovered: ${pId} ${name ? "with name:" + name : ""}`)
        setPeripheralId(pId)
      }
    )

    const onConnectedPeripheralListener = bleDidcommSdkEmitter.addListener(
      "onConnectedPeripheral",
      ({ peripheralId: pId }: { peripheralId: string }) => {
        console.log(`Connected to: ${pId}`)
        setConnected(true)
      }
    )

    const onReceivedNotificationListener = bleDidcommSdkEmitter.addListener(
      "onReceivedNotification",
      console.log
    )

    const onReceivedWriteWithoutResponseListener = bleDidcommSdkEmitter.addListener(
      "onReceivedWriteWithoutResponse",
      console.log
    )

    return () => {
      onDiscoverPeripheralListener.remove()
      onConnectedPeripheralListener.remove()
      onReceivedNotificationListener.remove()
      onReceivedWriteWithoutResponseListener.remove()
    }
  }, [])

  return (
    <View style={styles.container}>
      <Text>Bluetooth demo screen</Text>
      <Spacer />
      {Platform.OS === "android" && (
        <>
          <Button
            title="requestPermissions"
            onPress={async () => {
              await requestPermissions()
            }}
          />
          <Spacer />
        </>
      )}
      <Button
        title="start: central"
        onPress={async () => {
          await startCentral({
            serviceUUID: DIDCOMM_SERVICE_UUID,
            messagingUUID: MESSAGE_CHARACTERISTIC_UUID,
            indicationUUID: NOTIFY_CHARACTERISTIC_UUID,
          })
          setIsCentral(true)
        }}
      />
      <Button
        title="start: peripheral"
        onPress={async () => {
          await startPeripheral({
            serviceUUID: DIDCOMM_SERVICE_UUID,
            messagingUUID: MESSAGE_CHARACTERISTIC_UUID,
            indicationUUID: NOTIFY_CHARACTERISTIC_UUID,
          })
          setIsPeripheral(true)
        }}
      />
      {isCentral && (
        <>
          <Button title="scan" onPress={scan} />
          {peripheralId && (
            <Button title="connect" onPress={() => connect(peripheralId)} />
          )}
          {connected && <Button title="write" onPress={() => write(msg)} />}
        </>
      )}
      {isPeripheral && (
        <>
          <Button title="advertise" onPress={advertise} />
          <Button title="notify" onPress={() => indicate(msg)} />
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
})
