import { type ConfigPlugin, withAndroidManifest, withInfoPlist } from '@expo/config-plugins'

const BLUETOOTH_ALWAYS = 'Allow $(PRODUCT_NAME) to connect to bluetooth devices'

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

const withAndroidPermissions: ConfigPlugin = (expoConfig) =>
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

const withIosPermissions: ConfigPlugin<{
  bluetoothAlwaysPermission?: string | false
}> = (config, { bluetoothAlwaysPermission }) =>
  withInfoPlist(config, (modConfig) => {
    if (bluetoothAlwaysPermission !== false) {
      modConfig.modResults.NSBluetoothAlwaysUsageDescription =
        bluetoothAlwaysPermission || modConfig.modResults.NSBluetoothAlwaysUsageDescription || BLUETOOTH_ALWAYS
    }
    return modConfig
  })

const withBle: ConfigPlugin<{
  bluetoothAlwaysPermission?: string | false
}> = (_config, props = {}) => {
  let config = _config

  config = withAndroidPermissions(config)
  config = withIosPermissions(_config, props)

  return config
}

export default withBle
