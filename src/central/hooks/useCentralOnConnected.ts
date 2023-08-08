import { useEffect } from 'react'
import { useCentral } from '../CentralProvider'

export const useCentralOnConnected = (
  cb: (identifier: string) => void | Promise<void>
) => {
  const { central } = useCentral()

  useEffect(() => {
    const listener = central.registerOnConnectedListener(({ identifier }) =>
      cb(identifier)
    )

    return () => {
      listener.remove()
    }
  }, [])
}
