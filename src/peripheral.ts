import type { Ble, ServiceOptions } from './ble'
import { NativeEventEmitter, NativeModules } from 'react-native'
import { sdk } from './register'

export class Peripheral implements Ble {
  bleDidcommEmitter = new NativeEventEmitter(NativeModules.BleDidcomm)

  async sendMessage(message: string) {
    try {
      await sdk.indicate(message)
    } catch (e) {
      throw new Error(`An error occurred while trying to write message` + e)
    }
  }

  async start() {
    try {
      await sdk.startPeripheral({})
    } catch (e) {
      throw new Error('An error occurred during startup: ' + e)
    }
  }

  async setService(options: ServiceOptions): Promise<void> {
    try {
      await sdk.setPeripheralService(
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
    const onReceivedNotificationListener = this.bleDidcommEmitter.addListener(
      'onReceivedWriteWithoutResponse',
      cb
    )

    return onReceivedNotificationListener
  }

  async advertise() {
    try {
      await sdk.advertise({})
    } catch (e) {
      throw new Error('An error occurred while trying to advertise: ' + e)
    }
  }
}
