import { sdk } from './register'

export const isBleEnabled = async () => {
  return true
  try {
    return await sdk.isBleEnabled({})
  } catch (e) {
    throw new Error(`An error occured while trying to check the ble state: ${e}`)
  }
}
