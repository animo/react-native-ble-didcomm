import { sdk } from "./register"
import { DIDCOMM_SERVICE_UUID, MESSAGE_CHARACTERISTIC_UUID } from "./constants"

export const setupBle = async () => {
  try {
    await sdk.start({})
    await new Promise((resolve) => setTimeout(resolve, 500))
    await sdk.preparePeripheral(
      DIDCOMM_SERVICE_UUID,
      MESSAGE_CHARACTERISTIC_UUID
    )
  } catch (e) {
    throw new Error("An error occured during startup: " + e)
  }
}

export const notify = async (message: string) => {
  try {
    await sdk.notify(message)
  } catch (e) {
    throw new Error(
      "An error occurred while sending a message as a peripheral: " + e
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

export const scan = async ({
  serviceUUID,
  characteristicUUID,
}: {
  serviceUUID: string
  characteristicUUID: string
}) => {
  try {
    await sdk.scan(serviceUUID, characteristicUUID)
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

export const write = async (peripheralId: string, message: string) => {
  try {
    await sdk.write(peripheralId, message)
  } catch (e) {
    throw new Error(
      `An error occurred while trying to write message ${message} to ${peripheralId}: ` +
        e
    )
  }
}
