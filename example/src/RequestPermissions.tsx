import React from 'react'
import { PermissionsAndroid, Button } from 'react-native'

export const RequestPermissions = () => {
  const requestPermissions = async () => {
    await PermissionsAndroid.requestMultiple([
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.BLUETOOTH_CONNECT',
      'android.permission.BLUETOOTH_SCAN',
      'android.permission.BLUETOOTH_ADVERTISE',
      'android.permission.ACCESS_COARSE_LOCATION',
    ])
  }

  return (
    <Button
      title="requestPermissions"
      onPress={async () => {
        await requestPermissions()
      }}
    />
  )
}
