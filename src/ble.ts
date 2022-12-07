import type { EmitterSubscription } from 'react-native'

export type StartOptions = {
  serviceUUID: string
  messagingUUID: string
  indicationUUID: string
}

export interface Ble {
  sendMessage(message: string): Promise<void>
  start(options: StartOptions): Promise<void>
  //   TODO: implement native shutdown
  shutdown(): Promise<void>
  registerMessageListener(cb: (msg: string) => void): EmitterSubscription
}
