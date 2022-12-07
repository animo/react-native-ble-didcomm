export abstract class BaseBLE {
  abstract sendMessage(message: string): Promise<void>
  abstract start(
    serviceUUID: string,
    writeCharacteristicUUID: string,
    indicationCharacteristicUUID: string
  ): Promise<void>
  //   TODO: implement native shutdown
  abstract shutdown(): Promise<void>
  abstract registerMessageListener(cb: (msg: string) => void): void
}
