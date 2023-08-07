import type { PropsWithChildren } from 'react'
import type { Peripheral } from './peripheral'

import { useContext } from 'react'
import * as React from 'react'

interface PeripheralContextInterface {
  peripheral?: Peripheral | undefined
}

interface PeripheralProps {
  peripheral: Peripheral | undefined
}

export const PeripheralContext = React.createContext<
  PeripheralContextInterface | undefined
>(undefined)

export const usePeripheral = () => {
  const peripheralContext = useContext(PeripheralContext)
  if (!peripheralContext) {
    throw new Error('usePeripheral must be used within a ContextProvider')
  }
  return peripheralContext
}

const PeripheralProvider: React.FC<PropsWithChildren<PeripheralProps>> = ({
  peripheral,
  children,
}) => {
  const peripheralState: PeripheralContextInterface = {
    peripheral: peripheral,
  }

  return (
    <PeripheralContext.Provider value={peripheralState}>
      {children}
    </PeripheralContext.Provider>
  )
}

export default PeripheralProvider
