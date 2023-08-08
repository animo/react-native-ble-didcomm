import type { Peripheral } from './peripheral'
import type { PropsWithChildren } from 'react'
import { useContext } from 'react'
import * as React from 'react'

interface PeripheralContextItems {
  peripheral: Peripheral
}

const PeripheralContext = React.createContext<
  PeripheralContextItems | undefined
>(undefined)

export const usePeripheral = () => {
  const peripheralContext = useContext(PeripheralContext)
  if (!peripheralContext) {
    throw new Error(
      'Peripheral hook is not called within the PeripheralProvider'
    )
  }
  return peripheralContext
}

export const PeripheralProvider: React.FC<
  PropsWithChildren<{ peripheral: Peripheral }>
> = ({ peripheral, children }) => {
  return (
    <PeripheralContext.Provider value={{ peripheral }}>
      {children}
    </PeripheralContext.Provider>
  )
}
