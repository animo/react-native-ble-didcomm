import { isBleEnabled } from '@animo-id/react-native-ble-didcomm'
import * as React from 'react'
import { useState } from 'react'
import { Alert, Button, PermissionsAndroid, Platform, StyleSheet, Text, View } from 'react-native'
import { Spacer } from '../Spacer'
import { Central } from './Central'
import { Peripheral } from './Peripheral'

const requestPermissions = async () => {
  await PermissionsAndroid.requestMultiple([
    'android.permission.ACCESS_FINE_LOCATION',
    'android.permission.BLUETOOTH_CONNECT',
    'android.permission.BLUETOOTH_SCAN',
    'android.permission.BLUETOOTH_ADVERTISE',
    'android.permission.ACCESS_COARSE_LOCATION',
  ])
}

export const RegularScreen = () => {
  const [isCentral, setIsCentral] = useState<boolean>(false)
  const [isPeripheral, setIsPeripheral] = useState<boolean>(false)

  const asCentral = () => setIsCentral(true)

  const asPeripheral = () => setIsPeripheral(true)

  return (
    <View style={styles.container}>
      <Text>foo Bluetooth demo screen. role: {isCentral ? 'central' : isPeripheral ? 'peripheral' : 'none'}</Text>
      <Spacer />
      <Button
        title="is ble enabled"
        onPress={() => isBleEnabled().then((isEnabled) => Alert.alert(isEnabled ? 'yes' : 'no'))}
      />
      <Spacer />
      {Platform.OS === 'android' && (
        <Button
          title="requestPermissions"
          onPress={async () => {
            await requestPermissions()
          }}
        />
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
    justifyContent: 'center',
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
})
