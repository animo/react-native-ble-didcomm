import { NativeModules, Platform } from 'react-native'
import type { BleState } from './ble'

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

type Sdk = {
  startPeripheral({}: Record<string, never>): Promise<void>
  startCentral({}: Record<string, never>): Promise<void>
  setCentralService(
    serviceUUID: string,
    characteristicUUID: string,
    notifyCharacteristicUUID: string
  ): Promise<void>
  getState(): BleState
  setPeripheralService(
    serviceUUID: string,
    characteristicUUID: string,
    notifyCharacteristicUUID: string
  ): Promise<void>
  shutdownCentral({}: Record<never, never>): Promise<void>
  shutdownPeripheral({}: Record<never, never>): Promise<void>
  scan({}: Record<never, never>): Promise<void>
  stopScan(): void
  advertise({}: Record<never, never>): Promise<void>
  stopAdvertise(): Promise<void>
  connect(peripheralId: string): Promise<void>
  write(message: string): Promise<void>
  indicate(message: string): Promise<void>
}

export const sdk = BleDidcomm as Sdk
