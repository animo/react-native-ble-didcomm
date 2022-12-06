import { NativeEventEmitter, NativeModules } from 'react-native'
import { BaseBLE } from './base'
import { startCentral, write, scan, connect } from './functions'

export class Central extends BaseBLE {
  async sendMessage(message: string) {
    return await write(message)
  }
  async start(
    serviceUUID: string,
    writeCharacteristicUUID: string,
    indicationCharacteristicUUID: string
  ) {
    return await startCentral({
      serviceUUID: serviceUUID,
      messagingUUID: writeCharacteristicUUID,
      indicationUUID: indicationCharacteristicUUID,
    })
  }

  async shutdown() {
    // TODO: Implement native
    throw new Error('Not implemented')
  }

  async registerMessageListener(cb: (msg: string) => void): Promise<void> {
    const bleDidcommEmitter = new NativeEventEmitter(NativeModules.BleDidcomm)
    const onReceivedNotificationListener = bleDidcommEmitter.addListener(
      'onReceivedNotification',
      cb
    )

    return onReceivedNotificationListener.remove()
  }

  async scan() {
    return await scan()
  }

  async connect(peripheralId: string) {
    return await connect(peripheralId)
  }

  async registerOnScan(cb: (peripheralId: string) => void): Promise<void> {
    const bleDidcommEmitter = new NativeEventEmitter(NativeModules.BleDidcomm)
    const onDiscoverPeripheralListener = bleDidcommEmitter.addListener(
      'onDiscoverPeripheral',
      ({ peripheralId: pId }: { peripheralId: string; name?: string }) => {
        cb(pId)
      }
    )
    return onDiscoverPeripheralListener.remove()
  }

  constructor(
    start: (
      serviceUUID: string,
      writeCharacteristicUUID: string,
      indicationCharacteristicUUID: string
    ) => Promise<void>,
    sendMessage: (message: string) => Promise<void>,
    shutdown: () => Promise<void>,
    registerMessageListener: (cb: (msg: string) => void) => Promise<void>,
    scan: () => Promise<void>,
    connect: (peripheralId: string) => Promise<void>,
    registerOnScan: (cb: (peripheralId: string) => void) => Promise<void>
  ) {
    super()

    this.start = start
    this.sendMessage = sendMessage
    this.shutdown = shutdown
    this.registerMessageListener = registerMessageListener
    this.scan = scan
    this.connect = connect
    this.registerOnScan = registerOnScan
  }
}
