import { useEffect } from 'react'
import { useCentral } from '../CentralProvider'

export const useCentralOnReceivedMessage = (
  cb: (message: string) => void | Promise<void>
) => {
  const { central } = useCentral()

  useEffect(() => {
    const listener = central.registerMessageListener(({ message }) =>
      cb(message)
    )

    return () => {
      listener.remove()
    }
  }, [])
}
