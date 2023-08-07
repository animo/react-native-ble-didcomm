import { NativeEventEmitter, NativeModules } from 'react-native'
import type { Ble, ServiceOptions } from './ble'
import { sdk } from './register'

export class Peripheral implements Ble {
  bleDidcommEmitter = new NativeEventEmitter(NativeModules.BleDidcomm)

  public async sendMessage(message: string) {
    try {
      await sdk.indicate(message)
    } catch (e) {
      throw new Error(`An error occurred while trying to write message` + e)
    }
  }

  public async start() {
    try {
      await sdk.startPeripheral({})
    } catch (e) {
      throw new Error('An error occurred during startup: ' + e)
    }
  }

  public async setService(options: ServiceOptions): Promise<void> {
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

  public async shutdown() {
    try {
      await sdk.shutdownPeripheral({})
    } catch (e) {
      throw new Error('Failed to shutdown peripheral: ' + e)
    }
  }

  public async advertise() {
    try {
      await sdk.advertise({})
    } catch (e) {
      throw new Error('An error occurred while trying to advertise: ' + e)
    }
  }

  public registerMessageListener(cb: (data: { message: string }) => void) {
    const onReceivedNotificationListener = this.bleDidcommEmitter.addListener(
      'onReceivedWriteWithoutResponse',
      cb
    )

    return onReceivedNotificationListener
  }

  public registerOnConnectedListener(
    cb: ({ identifier, name }: { identifier: string; name?: string }) => void
  ) {
    const onConnectedPeripheralListener = this.bleDidcommEmitter.addListener(
      'onConnectedCentral',
      cb
    )
    return onConnectedPeripheralListener
  }

  public registerOnDisconnectedListener(
    cb: ({ identifier }: { identifier: string }) => void
  ) {
    const onDisconnectedPeripheralListener = this.bleDidcommEmitter.addListener(
      'onDisconnectedCentral',
      cb
    )
    return onDisconnectedPeripheralListener
  }
}
