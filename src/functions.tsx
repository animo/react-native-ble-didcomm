import { sdk } from "./register"

type StartOptions = {
  serviceUUID: string
  messagingUUID: string
  indicationUUID: string
}

export const startCentral = async ({
  serviceUUID,
  messagingUUID,
  indicationUUID,
}: StartOptions) => {
  try {
    await sdk.startCentral(serviceUUID, messagingUUID, indicationUUID)
  } catch (e) {
    throw new Error("An error occured during startup: " + e)
  }
}

export const startPeripheral = async ({
  serviceUUID,
  messagingUUID,
  indicationUUID,
}: StartOptions) => {
  try {
    await sdk.startPeripheral(serviceUUID, messagingUUID, indicationUUID)
  } catch (e) {
    throw new Error("An error occured during startup: " + e)
  }
}

export const shutdownCentral = async () => {
  try {
  await sdk.shutdownCentral({})
  } catch (e) {
    throw new Error("An error occured during shutdown central: " + e)
  }
}

export const shutdownPeripheral = async () => {
  try {
  await sdk.shutdownPeripheral({})
  } catch (e) {
    throw new Error("An error occured during shutdown peripheral: " + e)
  }
}

export const indicate = async (message: string) => {
  try {
    await sdk.indicate(message)
  } catch (e) {
    throw new Error(
      "An error occurred while sending an indication as a peripheral: " + e
    )
  }
}

export const advertise = async () => {
  try {
    await sdk.advertise({})
  } catch (e) {
    throw new Error("An error occurred while trying to advertise: " + e)
  }
}

export const scan = async () => {
  try {
    await sdk.scan({})
  } catch (e) {
    throw new Error("An error occurred while scanning for devices: " + e)
  }
}

export const connect = async (peripheralId: string) => {
  try {
    await sdk.connect(peripheralId)
  } catch (e) {
    throw new Error(
      `An error occurred while trying to connect to ${peripheralId}: ` + e
    )
  }
}

export const write = async (message: string) => {
  try {
    await sdk.write(message)
  } catch (e) {
    throw new Error(`An error occurred while trying to write message` + e)
  }
}
