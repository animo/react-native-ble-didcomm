import type { EmitterSubscription } from 'react-native'

export type ServiceOptions = {
  serviceUUID: string
  messagingUUID: string
  indicationUUID: string
}

export type BLEState = {
  isRunning?: boolean
  isScanning?: boolean
  isAdvertising?: boolean
  isConnected?: boolean
}

export interface Ble {
  state: BLEState
  sendMessage(message: string): Promise<void>
  start(): Promise<void>
  setService(options: ServiceOptions): Promise<void>
  getState(): BLEState
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
