import type { StartOptions, Ble } from './ble'
import { NativeEventEmitter, NativeModules } from 'react-native'
import { sdk } from './register'

export class Central implements Ble {
  bleDidcommEmitter = new NativeEventEmitter(NativeModules.BleDidcomm)

  async sendMessage(message: string) {
    try {
      await sdk.write(message)
    } catch (e) {
      throw new Error(`An error occurred while trying to write message` + e)
    }
  }

  async start(options: StartOptions) {
    try {
      await sdk.startCentral(
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
      'onReceivedNotification',
      cb
    )

    return onReceivedNotificationListener
  }

  async scan() {
    try {
      await sdk.scan({})
    } catch (e) {
      throw new Error('An error occurred while scanning for devices: ' + e)
    }
  }

  async connect(peripheralId: string) {
    try {
      await sdk.connect(peripheralId)
    } catch (e) {
      throw new Error(
        `An error occurred while trying to connect to ${peripheralId}: ` + e
      )
    }
  }

  registerOnDiscoveredListener(
    cb: ({
      peripheralId,
      name,
    }: {
      peripheralId: string
      name?: string
    }) => void
  ) {
    const onDiscoverPeripheralListener = this.bleDidcommEmitter.addListener(
      'onDiscoverPeripheral',
      ({
        peripheralId: pId,
        name,
      }: {
        peripheralId: string
        name?: string
      }) => {
        cb({ peripheralId: pId, name })
      }
    )
    return onDiscoverPeripheralListener
  }

  registerOnConnectedListener(
    cb: ({
      peripheralId,
      name,
    }: {
      peripheralId: string
      name?: string
    }) => void
  ) {
    const onConnectedPeripheralListener = this.bleDidcommEmitter.addListener(
      'onConnectedPeripheral',
      ({
        peripheralId: pId,
        name,
      }: {
        peripheralId: string
        name?: string
      }) => {
        cb({ peripheralId: pId, name })
      }
    )
    return onConnectedPeripheralListener
  }
}
