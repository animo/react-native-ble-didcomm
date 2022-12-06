import { BaseBLE } from './base'
import { startCentral, write, advertise, scan, connect } from './functions'

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
    return await Promise.resolve()
  }

  async registerMessageListener(cb: (msg: string) => void): Promise<void> {
    // TODO: what's this supposed to do?
    cb(cb.arguments as string)
    return await Promise.resolve()
  }

  async scan() {
    return await scan()
  }

  async connect(peripheralId: string) {
    return await connect(peripheralId)
  }

  async registerOnScan(cb: (peripheralId: string) => void): Promise<void> {
    cb(cb.arguments)
    return await Promise.resolve()
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
