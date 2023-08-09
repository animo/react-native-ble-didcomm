import { useEffect } from 'react'
import { useCentral } from '../CentralProvider'

export const useCentralShutdownOnUnmount = () => {
  const { central } = useCentral()

  useEffect(() => {
    return () => {
      void central.shutdown()
    }
  }, [])
}
