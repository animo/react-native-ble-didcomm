import type { EmitterSubscription } from 'react-native'

export type ServiceOptions = {
  serviceUUID: string
  messagingUUID: string
  indicationUUID: string
}

export type BleState = {
  isRunning: boolean
  isScanning: boolean
  isAdvertising: boolean
  isConnected: boolean
}

export const initialState: BleState = {
  isRunning: false,
  isScanning: false,
  isAdvertising: false,
  isConnected: false,
}

export interface Ble {
  sendMessage(message: string): Promise<void>
  start(): Promise<void>
  setService(options: ServiceOptions): Promise<void>
  shutdown(): Promise<void>
  registerMessageListener(
    cb: (data: { message: string }) => void
  ): EmitterSubscription
  registerOnConnectedListener(
    cb: (options: { identifier: string }) => void
  ): EmitterSubscription
  registerOnDisconnectedListener(
    cb: (options: { identifier: string }) => void
  ): EmitterSubscription
}
