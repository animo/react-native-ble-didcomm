import { useContext, useEffect, useState } from 'react'
import type { PropsWithChildren } from 'react'
import type { Peripheral } from './peripheral'
import * as React from 'react'

interface PeripheralContextInterface {
  loading: boolean
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
    throw new Error('useAgent must be used within a AgentContextProvider')
  }
  return peripheralContext
}

const PeripheralProvider: React.FC<PropsWithChildren<PeripheralProps>> = ({
  peripheral,
  children,
}) => {
  const [peripheralState, setPeripheralState] = useState<
    PeripheralContextInterface
  >({
    loading: true,
    peripheral: peripheral,
  })

  const setInitialState = async () => {
    if (peripheral) {
      setPeripheralState({ peripheral: peripheral, loading: false })
    }
  }

  useEffect(() => {
    setInitialState()
  }, [peripheralState])

  return (
    <PeripheralContext.Provider value={peripheralState}>
      {children}
    </PeripheralContext.Provider>
  )
}

export default PeripheralProvider
