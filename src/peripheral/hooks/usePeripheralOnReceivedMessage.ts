import { useEffect } from 'react'
import { usePeripheral } from '../PeripheralProvider'

export const usePeripheralOnReceivedMessage = (
  cb: (message: string) => void | Promise<void>
) => {
  const { peripheral } = usePeripheral()

  useEffect(() => {
    const listener = peripheral.registerMessageListener(({ message }) =>
      cb(message)
    )

    return () => {
      listener.remove()
    }
  }, [])
}
