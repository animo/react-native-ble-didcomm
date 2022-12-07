import { NativeEventEmitter, NativeModules } from 'react-native'
import { BaseBLE, StartOptions } from './base'
import { sdk } from './register'

export class Central extends BaseBLE {
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
        options.characteristicUUID,
        options.notifyCharacteristicUUID
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

  async registerOnScannedListener(cb: (peripheralId: string) => void) {
    const bleDidcommEmitter = new NativeEventEmitter(NativeModules.BleDidcomm)
    const onDiscoverPeripheralListener = bleDidcommEmitter.addListener(
      'onDiscoverPeripheral',
      ({ peripheralId: pId }: { peripheralId: string; name?: string }) => {
        cb(pId)
      }
    )
    return onDiscoverPeripheralListener
  }
}
