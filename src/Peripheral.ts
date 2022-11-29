import { Ble } from './Ble'
import { sdk } from './register'

export class Peripheral extends Ble {
  public async start(): Promise<void> {
    if (!this.serviceId || !this.messagingId || !this.indicationId) {
      throw new Error(
        `ServiceId, messagingId or indicationId not defined on class ${{
          messagingId: this.messagingId,
          serviceId: this.serviceId,
          indicationId: this.indicationId,
        }}`
      )
    }
    await sdk.startPeripheral(
      this.serviceId,
      this.messagingId,
      this.indicationId
    )
    this.started = true
  }

  public async stop(): Promise<void> {
    if (!this.started) {
      throw new Error(
        'Did not start peripheral yet. please call Peripheral.start()'
      )
    }
    await sdk.shutdownPeripheral({})
    this.setIds({})
    this.started = false
  }

  public async advertise(): Promise<void> {
    if (!this.started) {
      throw new Error(
        'Did not start peripheral yet. please call Peripheral.start()'
      )
    }
    await sdk.advertise({})
  }

  public async sendMessage(message: string): Promise<void> {
    if (!this.started) {
      throw new Error(
        'Did not start peripheral yet. please call Peripheral.start()'
      )
    }
    await sdk.indicate(message)
  }
}
