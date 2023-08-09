import { useEffect } from 'react'
import { usePeripheral } from '../PeripheralProvider'

export const usePeripheralShutdownOnUnmount = () => {
  const { peripheral } = usePeripheral()

  useEffect(() => {
    return () => {
      console.log('shutting down...')
      void peripheral.shutdown()
    }
  }, [])
}
