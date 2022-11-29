import { Ble } from './Ble'
import { sdk } from './register'

export class Central extends Ble {
  public async start(): Promise<void> {
    if (!this.serviceId || !this.messagingId || !this.indicationId) {
      throw new Error(
        `ServiceId, messagingId or indicationId not defined on class ${JSON.stringify(
          {
            messagingId: this.messagingId,
            serviceId: this.serviceId,
            indicationId: this.indicationId,
          }
        )}`
      )
    }
    await sdk.startCentral(this.serviceId, this.messagingId, this.indicationId)
    this.started = true
  }

  public async stop(): Promise<void> {
    if (!this.started) {
      throw new Error('Did not start central yet. please call Central.start()')
    }
    await sdk.shutdownCentral({})
    this.setIds({})
    this.started = false
  }

  public async scan(): Promise<void> {
    console.log(this)
    if (!this.started) {
      throw new Error('Did not start central yet. please call Central.start()')
    }
    await sdk.scan({})
  }

  public async connect(peripheralId: string): Promise<void> {
    if (!this.started) {
      throw new Error('Did not start central yet. please call Central.start()')
    }
    await sdk.connect(peripheralId)
  }

  public async sendMessage(message: string): Promise<void> {
    if (!this.started) {
      throw new Error('Did not start central yet. please call Central.start()')
    }
    await sdk.write(message)
  }
}
