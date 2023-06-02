import type { Ble, BleState, ServiceOptions } from './ble'
import { NativeEventEmitter, NativeModules } from 'react-native'
import { sdk } from './register'

const initialState: BleState = {
  isRunning: false,
  isAdvertising: false,
}

export class Peripheral implements Ble {
  bleDidcommEmitter = new NativeEventEmitter(NativeModules.BleDidcomm)
  state: BleState = initialState

  public getState(): BleState {
    try {
      return this.state
    } catch (e) {
      throw new Error('An error occurred setting internal module state: ' + e)
    }
  }

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
      this.state.isRunning = true
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
    this.state = initialState
  }

  public async advertise() {
    try {
      await sdk.advertise({})
      this.state.isAdvertising = true
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
