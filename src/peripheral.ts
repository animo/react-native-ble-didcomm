import type { Ble, StartOptions } from './ble'
import { NativeEventEmitter, NativeModules } from 'react-native'
import { write, advertise, startPeripheral, indicate } from './functions'

export class Peripheral implements Ble {
  async sendMessage(message: string) {
    await write(message)
  }

  async start(options: StartOptions) {
    await startPeripheral(options)
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
    await indicate(message)
  }

  async advertise() {
    await advertise()
  }
}
