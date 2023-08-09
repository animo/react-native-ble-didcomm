import { NativeModules, Platform } from 'react-native'

const LINKING_ERROR =
  'The package "react-native-ble-didcomm" doesn\'t seem to be linked. Make sure: \n\n' +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n'

const BleDidcomm = NativeModules.BleDidcomm
  ? NativeModules.BleDidcomm
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR)
        },
      }
    )

// Functions without any params needs an empty object to work, might be fixable by tweaking the Objective-C interface
// For now we just add an empty object to functions without any params.
type Sdk = {
  startPeripheral({}: Record<string, never>): Promise<void>
  startCentral({}: Record<string, never>): Promise<void>
  setCentralService(
    serviceUUID: string,
    characteristicUUID: string,
    notifyCharacteristicUUID: string
  ): Promise<void>
  setPeripheralService(
    serviceUUID: string,
    characteristicUUID: string,
    notifyCharacteristicUUID: string
  ): Promise<void>
  shutdownCentral({}: Record<string, never>): Promise<void>
  shutdownPeripheral({}: Record<string, never>): Promise<void>
  scan({}: Record<never, never>): Promise<void>
  stopScan(): void
  advertise({}: Record<never, never>): Promise<void>
  stopAdvertising(): Promise<void>
  connect(peripheralId: string): Promise<void>
  write(message: string): Promise<void>
  indicate(message: string): Promise<void>
}

export const sdk = BleDidcomm as Sdk
