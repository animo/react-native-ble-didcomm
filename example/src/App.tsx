import * as React from 'react'
import {
  StyleSheet,
  View,
  Text,
  Button,
  PermissionsAndroid,
  Platform
} from 'react-native'
import { Central } from './Central'
import { Peripheral } from './Peripheral'
import { isBleEnabled } from '@animo-id/react-native-ble-didcomm'

export const Spacer = () => <View style={{ height: 20, width: 20 }} />

const requestPermissions = async () => {
  await PermissionsAndroid.requestMultiple([
    'android.permission.ACCESS_FINE_LOCATION',
    'android.permission.BLUETOOTH_CONNECT',
    'android.permission.BLUETOOTH_SCAN',
    'android.permission.BLUETOOTH_ADVERTISE',
    'android.permission.ACCESS_COARSE_LOCATION'
  ])
}

export default function App() {
  const [isCentral, setIsCentral] = React.useState<boolean>(false)
  const [isPeripheral, setIsPeripheral] = React.useState<boolean>(false)

  const asCentral = () => setIsCentral(true)

  const asPeripheral = () => setIsPeripheral(true)

  return (
    <View style={styles.container}>
      <Text>
        Bluetooth demo screen. role:{' '}
        {isCentral ? 'central' : isPeripheral ? 'peripheral' : 'none'}
      </Text>
      <Spacer />
      <Button
        title="is ble enabled"
        onPress={async () => console.log(await isBleEnabled())}
      />
      {Platform.OS === 'android' && (
        <>
          <Button
            title="requestPermissions"
            onPress={async () => {
              await requestPermissions()
            }}
          />
        </>
      )}
      <Spacer />
      {(isCentral || isPeripheral) && (
        <>
          <Button
            title="Back"
            onPress={() => {
              setIsCentral(false)
              setIsPeripheral(false)
            }}
          />
          <Spacer />
        </>
      )}
      {!isCentral && !isPeripheral && (
        <>
          <Button title="Central" onPress={asCentral} />
          <Spacer />
          <Button title="Peripheral" onPress={asPeripheral} />
        </>
      )}
      {isCentral && <Central />}
      {isPeripheral && <Peripheral />}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20
  }
})
