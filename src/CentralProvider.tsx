import type { Central } from './central'
import type { PropsWithChildren } from 'react'

import { useContext, useEffect, useState } from 'react'
import * as React from 'react'

interface CentralContextInterface {
  loading: boolean
  central?: Central | undefined
}

interface CentralProps {
  central: Central | undefined
}

export const CentralContext = React.createContext<
  CentralContextInterface | undefined
>(undefined)

export const useCentral = () => {
  const peripheralContext = useContext(CentralContext)
  if (!peripheralContext) {
    throw new Error('useAgent must be used within a AgentContextProvider')
  }
  return peripheralContext
}

const PeripheralProvider: React.FC<PropsWithChildren<CentralProps>> = ({
  central,
  children,
}) => {
  const [centralState, setCentralState] = useState<CentralContextInterface>({
    loading: true,
    central: central,
  })

  const setInitialState = async () => {
    if (central) {
      setCentralState({ central: central, loading: false })
    }
  }

  useEffect(() => {
    setInitialState()
  }, [centralState])

  return (
    <CentralContext.Provider value={centralState}>
      {children}
    </CentralContext.Provider>
  )
}

export default PeripheralProvider
