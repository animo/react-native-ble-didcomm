export interface BaseBLE {
  sendMessage(message: string): Promise<void>
  start(
    serviceUUID: string,
    writeCharacteristicUUID: string,
    indicationCharacteristicUUID: string
  ): Promise<void>
  //   TODO: implement native shutdown
  shutdown(): Promise<void>
  registerMessageListener(cb: (msg: string) => void): void
}
