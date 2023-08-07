import { NativeEventEmitter, NativeModules } from 'react-native'
import type { Ble, ServiceOptions } from './ble'
import { sdk } from './register'

export class Central implements Ble {
  bleDidcommEmitter = new NativeEventEmitter(NativeModules.BleDidcomm)

  public async sendMessage(message: string) {
    try {
      await sdk.write(message)
    } catch (e) {
      throw new Error(`An error occurred while trying to write message` + e)
    }
  }

  public async start() {
    try {
      await sdk.startCentral({})
    } catch (e) {
      throw new Error('An error occurred during startup: ' + e)
    }
  }

  public async setService(options: ServiceOptions): Promise<void> {
    try {
      await sdk.setCentralService(
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
      await sdk.shutdownCentral({})
    } catch (e) {
      throw new Error('Failed to shutdown central: ' + e)
    }
  }

  registerMessageListener(cb: (data: { message: string }) => void) {
    const onReceivedNotificationListener = this.bleDidcommEmitter.addListener(
      'onReceivedNotification',
      cb
    )

    return onReceivedNotificationListener
  }

  public async scan() {
    try {
      await sdk.scan({})
    } catch (e) {
      throw new Error('An error occurred while scanning for devices: ' + e)
    }
  }

  public async connect(peripheralId: string) {
    try {
      await sdk.connect(peripheralId)
    } catch (e) {
      throw new Error(
        `An error occurred while trying to connect to ${peripheralId}: ` + e
      )
    }
  }

  public registerOnDiscoveredListener(
    cb: ({ identifier, name }: { identifier: string; name?: string }) => void
  ) {
    const onDiscoverPeripheralListener = this.bleDidcommEmitter.addListener(
      'onDiscoverPeripheral',
      cb
    )
    return onDiscoverPeripheralListener
  }

  public registerOnConnectedListener(
    cb: ({ identifier, name }: { identifier: string; name?: string }) => void
  ) {
    const onConnectedPeripheralListener = this.bleDidcommEmitter.addListener(
      'onConnectedPeripheral',
      cb
    )
    return onConnectedPeripheralListener
  }

  public registerOnDisconnectedListener(
    cb: ({ identifier }: { identifier: string }) => void
  ) {
    const onDisconnectedPeripheralListener = this.bleDidcommEmitter.addListener(
      'onDisconnectedPeripheral',
      cb
    )
    return onDisconnectedPeripheralListener
  }
}
