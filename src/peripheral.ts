import type { Ble, StartOptions } from './ble'
import { NativeEventEmitter, NativeModules } from 'react-native'
import { sdk } from './register'

export class Peripheral implements Ble {
  async sendMessage(message: string) {
    try {
      await sdk.write(message)
    } catch (e) {
      throw new Error(`An error occurred while trying to write message` + e)
    }
  }

  async start(options: StartOptions) {
    try {
      await sdk.startPeripheral(
        options.serviceUUID,
        options.messagingUUID,
        options.indicationUUID
      )
    } catch (e) {
      throw new Error('An error occurred during startup: ' + e)
    }
  }

  async shutdown() {
    // TODO: Implement native
    throw new Error('Not implemented')
  }

  registerMessageListener(cb: (msg: string) => void) {
    const bleDidcommEmitter = new NativeEventEmitter(NativeModules.BleDidcomm)
    const onReceivedNotificationListener = bleDidcommEmitter.addListener(
      'onReceivedNotification',
      cb
    )

    return onReceivedNotificationListener
  }

  async indicate(message: string) {
    try {
      await sdk.indicate(message)
    } catch (e) {
      throw new Error(
        'An error occurred while sending an indication as a peripheral: ' + e
      )
    }
  }

  async advertise() {
    try {
      await sdk.advertise({})
    } catch (e) {
      throw new Error('An error occurred while trying to advertise: ' + e)
    }
  }
}
