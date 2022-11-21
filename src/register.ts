import { NativeModules, Platform } from 'react-native'

const LINKING_ERROR =
  'The package "react-native-ble-didcomm-sdk" doesn\'t seem to be linked. Make sure: \n\n' +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n'

const BleDidcommSdk = NativeModules.BleDidcommSdk
  ? NativeModules.BleDidcommSdk
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR)
        },
      }
    )

type Sdk = {
  startPeripheral(serviceUUID: string, characteristicUUID: string, notifyCharacteristicUUID: string): Promise<void>
  startCentral(serviceUUID: string, characteristicUUID: string, notifyCharacteristicUUID: string): Promise<void>
  shutdownCentral({}: Record<never, never>): Promise<void>
  shutdownPeripheral({}: Record<never, never>): Promise<void>
  scan({}: Record<never, never>): Promise<void>
  advertise({}: Record<never, never>): Promise<void>
  connect(peripheralId: string): Promise<void>
  write(message: string): Promise<void>
  indicate(message: string): Promise<void>
}

export const sdk = BleDidcommSdk as Sdk
