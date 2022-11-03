import { sdk } from "./register"
import {
  DIDCOMM_SERVICE_UUID,
  MESSAGE_CHARACTERISTIC_UUID,
  NOTIFY_CHARACTERISTIC_UUID,
} from "./constants"

export const startCentral = async () => {
  try {
    await sdk.startCentral(
      DIDCOMM_SERVICE_UUID,
      MESSAGE_CHARACTERISTIC_UUID,
      NOTIFY_CHARACTERISTIC_UUID
    )
  } catch (e) {
    throw new Error("An error occured during startup: " + e)
  }
}

export const startPeripheral = async () => {
  try {
    await sdk.startPeripheral(
      DIDCOMM_SERVICE_UUID,
      MESSAGE_CHARACTERISTIC_UUID,
      NOTIFY_CHARACTERISTIC_UUID
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
