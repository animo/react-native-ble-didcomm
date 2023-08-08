import { useEffect } from 'react'
import { usePeripheral } from '../PeripheralProvider'

export const usePeripheralOnConnected = (
  cb: (identifier: string) => void | Promise<void>
) => {
  const { peripheral } = usePeripheral()

  useEffect(() => {
    const listener = peripheral.registerOnConnectedListener(({ identifier }) =>
      cb(identifier)
    )

    return () => {
      listener.remove()
    }
  }, [])
}
