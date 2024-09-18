import { useEffect } from 'react'
import { useCentral } from '../CentralProvider'

export const useCentralOnDiscovered = (cb: (identifier: string) => void | Promise<void>) => {
  const { central } = useCentral()

  useEffect(() => {
    const listener = central.registerOnDiscoveredListener(({ identifier }) => cb(identifier))

    return () => {
      listener.remove()
    }
  }, [central.registerOnDiscoveredListener, cb])
}
