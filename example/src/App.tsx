/* eslint-disable react-native/no-inline-styles */
import * as React from 'react'
import {
  StyleSheet,
  View,
  Text,
  Button,
  PermissionsAndroid,
  Platform,
  NativeEventEmitter,
  NativeModules,
} from 'react-native'
import {
  Central,
  startPeripheral,
  advertise,
  scan,
  write,
  indicate,
  DEFAULT_DIDCOMM_SERVICE_UUID,
  DEFAULT_DIDCOMM_MESSAGE_CHARACTERISTIC_UUID,
  DEFAULT_DIDCOMM_INDICATE_CHARACTERISTIC_UUID,
} from '@animo-id/react-native-ble-didcomm'
import { presentationMsg } from './presentationMsg'

const bleDidcommEmitter = new NativeEventEmitter(NativeModules.BleDidcomm)

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
  const [isCentral, setIsCentral] = React.useState(false)
  const [isPeripheral, setIsPeripheral] = React.useState(false)
  const [peripheralId, setPeripheralId] = React.useState<string>()
  const [connected, setConnected] = React.useState(false)
  const central = new Central()

  React.useEffect(() => {
    const onDiscoverPeripheralListener = central.registerOnScannedListener(
      (pId: string) => {
        console.log(`Discovered: ${pId}`)
        setPeripheralId(pId)
      }
    )

    const onConnectedPeripheralListener = bleDidcommEmitter.addListener(
      'onConnectedPeripheral',
      ({ peripheralId: pId }: { peripheralId: string }) => {
        console.log(`Connected to: ${pId}`)
        setConnected(true)
      }
    )

    const onReceivedNotificationListener = central.registerMessageListener(
      console.log
    )

    const onReceivedWriteWithoutResponseListener = bleDidcommEmitter.addListener(
      'onReceivedWriteWithoutResponse',
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
      <Button
        title="start: central"
        onPress={async () => {
          await central.start({
            serviceUUID: DEFAULT_DIDCOMM_SERVICE_UUID,
            messagingUUID: DEFAULT_DIDCOMM_MESSAGE_CHARACTERISTIC_UUID,
            indicationUUID: DEFAULT_DIDCOMM_INDICATE_CHARACTERISTIC_UUID,
          })
          setIsCentral(true)
        }}
      />
      <Button
        title="start: peripheral"
        onPress={async () => {
          await startPeripheral({
            serviceUUID: DEFAULT_DIDCOMM_SERVICE_UUID,
            messagingUUID: DEFAULT_DIDCOMM_MESSAGE_CHARACTERISTIC_UUID,
            indicationUUID: DEFAULT_DIDCOMM_INDICATE_CHARACTERISTIC_UUID,
          })
          setIsPeripheral(true)
        }}
      />
      {isCentral && (
        <>
          <Button title="scan" onPress={scan} />
          {peripheralId && (
            <Button
              title="connect"
              onPress={() => central.connect(peripheralId)}
            />
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
})
