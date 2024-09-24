import { useEffect } from 'react'
import { useCentral } from '../CentralProvider'

export const useCentralOnDisconnected = (cb: (identifier: string) => void | Promise<void>) => {
  const { central } = useCentral()

  useEffect(() => {
    const listener = central.registerOnDisconnectedListener(({ identifier }) => cb(identifier))

    return () => {
      listener.remove()
    }
  }, [central.registerOnDisconnectedListener, cb])
}
