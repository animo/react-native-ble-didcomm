import * as React from 'react'
import {
  StyleSheet,
  View,
  Text,
  Button,
  PermissionsAndroid,
  Platform,
} from 'react-native'
import {
  Central,
  Peripheral,
  DEFAULT_DIDCOMM_SERVICE_UUID,
  DEFAULT_DIDCOMM_MESSAGE_CHARACTERISTIC_UUID,
  DEFAULT_DIDCOMM_INDICATE_CHARACTERISTIC_UUID,
} from '@animo-id/react-native-ble-didcomm'
import { presentationMsg } from './bigPresentationMsg'

const Spacer = () => <View style={{ height: 20, width: 20 }} />

const msg = JSON.stringify(presentationMsg)

const requestPermissions = async () => {
  await PermissionsAndroid.requestMultiple([
    'android.permission.ACCESS_FINE_LOCATION',
    'android.permission.BLUETOOTH_CONNECT',
    'android.permission.BLUETOOTH_SCAN',
    'android.permission.BLUETOOTH_ADVERTISE',
    'android.permission.ACCESS_COARSE_LOCATION',
  ])
}

export default function App() {
  const central = new Central()
  const peripheral = new Peripheral()

  const [isCentral, setIsCentral] = React.useState<boolean>(false)
  const [isPeripheral, setIsPeripheral] = React.useState<boolean>(false)
  const [peripheralId, setPeripheralId] = React.useState<string>()
  const [isConnected, setIsConnected] = React.useState<boolean>(false)

  React.useEffect(() => {
    const onDiscoverPeripheralListener = central.registerOnDiscoveredListener(
      ({ identifier }: { identifier: string }) => {
        console.log(`Discovered: ${identifier}`)
        setPeripheralId(identifier)
      }
    )

    const onConnectedPeripheralListener = central.registerOnConnectedListener(
      ({ identifier }: { identifier: string }) => {
        console.log(`Connected to: ${identifier}`)
        setIsConnected(true)
      }
    )

    const onConnectedCentralListener = peripheral.registerOnConnectedListener(
      console.log
    )

    const onDisconnectedCentralListener =
      peripheral.registerOnDisconnectedListener(console.log)

    const onDisconnectedPeripheralListener =
      central.registerOnDisconnectedListener(console.log)

    const onReceivedNotificationListener = central.registerMessageListener(
      console.log
    )

    const onReceivedWriteWithoutResponseListener =
      peripheral.registerMessageListener(console.log)

    return () => {
      onDiscoverPeripheralListener.remove()
      onConnectedPeripheralListener.remove()
      onConnectedCentralListener.remove()
      onReceivedNotificationListener.remove()
      onReceivedWriteWithoutResponseListener.remove()
      onDisconnectedCentralListener.remove()
      onDisconnectedPeripheralListener.remove()
    }
  }, [])

  return (
    <View style={styles.container}>
      <Text>Bluetooth demo screen</Text>
      <Spacer />
      {Platform.OS === 'android' && (
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
      {!isCentral && !isPeripheral && (
        <>
          <Button
            title="start: central"
            onPress={async () => {
              await central.start()
              setIsCentral(true)
            }}
          />
          <Button
            title="start: peripheral"
            onPress={async () => {
              await peripheral.start()
              setIsPeripheral(true)
            }}
          />
        </>
      )}
      {isCentral && (
        <>
          <Button
            title="shutdown"
            onPress={async () => {
              await central.shutdown()
              setIsConnected(false)
              setIsCentral(false)
              setPeripheralId(undefined)
            }}
          />
          <Button
            title="set services"
            onPress={async () => {
              await central.setService({
                serviceUUID: DEFAULT_DIDCOMM_SERVICE_UUID,
                messagingUUID: DEFAULT_DIDCOMM_MESSAGE_CHARACTERISTIC_UUID,
                indicationUUID: DEFAULT_DIDCOMM_INDICATE_CHARACTERISTIC_UUID,
              })
            }}
          />
          <Button
            title="scan"
            onPress={async () => {
              await central.scan()
            }}
          />

          {peripheralId && (
            <Button
              title="connect"
              onPress={async () => await central.connect(peripheralId)}
            />
          )}
          {isConnected && (
            <Button
              title="write"
              onPress={async () => await central.sendMessage(msg)}
            />
          )}
        </>
      )}
      {isPeripheral && (
        <>
          <Button
            title="shutdown"
            onPress={async () => {
              await peripheral.shutdown()
              setIsConnected(false)
              setIsPeripheral(false)
            }}
          />
          <Button
            title="set services"
            onPress={async () => {
              await peripheral.setService({
                serviceUUID: DEFAULT_DIDCOMM_SERVICE_UUID,
                messagingUUID: DEFAULT_DIDCOMM_MESSAGE_CHARACTERISTIC_UUID,
                indicationUUID: DEFAULT_DIDCOMM_INDICATE_CHARACTERISTIC_UUID,
              })
            }}
          />
          <Button title="advertise" onPress={() => peripheral.advertise()} />
          <Button title="notify" onPress={() => peripheral.sendMessage(msg)} />
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
})
