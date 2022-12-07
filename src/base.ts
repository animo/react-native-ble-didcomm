import type { EmitterSubscription } from 'react-native'

export type StartOptions = {
  serviceUUID: string
  messagingUUID: string
  indicationUUID: string
}

export abstract class BaseBLE {
  abstract sendMessage(message: string): Promise<void>
  abstract start(options: StartOptions): Promise<void>
  //   TODO: implement native shutdown
  abstract shutdown(): Promise<void>
  abstract registerMessageListener(
    cb: (msg: string) => void
  ): EmitterSubscription
}
