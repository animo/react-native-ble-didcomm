import { useEffect } from 'react'
import { usePeripheral } from '../PeripheralProvider'

export const usePeripheralOnDisconnected = (cb: (identifier: string) => void | Promise<void>) => {
  const { peripheral } = usePeripheral()

  useEffect(() => {
    const listener = peripheral.registerOnDisconnectedListener(({ identifier }) => cb(identifier))

    return () => {
      listener.remove()
    }
  }, [peripheral.registerOnDisconnectedListener, cb])
}
