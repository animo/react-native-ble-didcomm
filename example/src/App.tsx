import * as React from 'react'
import {
  StyleSheet,
  View,
  Button,
  PermissionsAndroid,
  Platform,
} from 'react-native'
import { CentralComponent } from './CentralComponent'
import { PeripheralComponent } from './PeripheralComponent'

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

  if (isCentral) {
    return (
      <View style={styles.container}>
        <CentralComponent />
      </View>
    )
  }

  if (isPeripheral) {
    return (
      <View style={styles.container}>
        <PeripheralComponent />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {Platform.OS === 'android' && (
        <Button
          title="requestPermissions"
          onPress={async () => {
            await requestPermissions()
          }}
        />
      )}
      <Button title="peripheral" onPress={() => setIsPeripheral(true)} />
      <Button title="central" onPress={() => setIsCentral(true)} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
