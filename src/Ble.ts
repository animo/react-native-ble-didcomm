export abstract class Ble {
  public serviceId?: string
  public messagingId?: string
  public indicationId?: string
  public started: boolean = false

  public abstract sendMessage(message: string): Promise<void>

  public abstract start(): Promise<void>

  public abstract stop(): Promise<void>

  public setIds(options: {
    serviceId?: string
    messagingId?: string
    indicationId?: string
  }) {
    this.serviceId = options.serviceId
    this.messagingId = options.messagingId
    this.indicationId = options.indicationId
  }
}
