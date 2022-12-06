import { BaseBLE } from './base'
import { startCentral, write, advertise } from './functions'

export class Peripheral extends BaseBLE {
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

  async advertise() {
    return await advertise()
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
    advertise: () => Promise<void>
  ) {
    super()

    this.start = start
    this.sendMessage = sendMessage
    this.shutdown = shutdown
    this.registerMessageListener = registerMessageListener
    this.advertise = advertise
  }
}
