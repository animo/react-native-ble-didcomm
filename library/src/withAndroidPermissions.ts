import { type ConfigPlugin, withAndroidManifest } from '@expo/config-plugins'

const permissions = [
  'android.permission.INTERNET',
  'android.permission.BLUETOOTH',
  'android.permission.BLUETOOTH_ADMIN',
  'android.permission.BLUETOOTH_SCAN',
  'android.permission.BLUETOOTH_ADVERTISE',
  'android.permission.BLUETOOTH_CONNECT',
  'android.permission.ACCESS_BACKGROUND_LOCATION',
  'android.permission.ACCESS_FINE_LOCATION',
  'android.permission.ACCESS_COARSE_LOCATION',
]

const withAndroidPermissions: ConfigPlugin = (expoConfig: unknown) =>
  //@ts-ignore
  withAndroidManifest(expoConfig, (modConfig) => {
    const androidManifest = modConfig.modResults.manifest

    androidManifest['uses-permission'] = [
      ...permissions.map((permission) => ({
        $: {
          'android:name': permission,
        },
      })),
    ]

    return modConfig
  })

export default withAndroidPermissions
