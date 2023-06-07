import type { Central } from './central'
import type { PropsWithChildren } from 'react'

import { useContext } from 'react'
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
    throw new Error('useCentral must be used within a ContextProvider')
  }
  return peripheralContext
}

const PeripheralProvider: React.FC<PropsWithChildren<CentralProps>> = ({
  central,
  children,
}) => {
  const centralState: CentralContextInterface = {
    loading: true,
    central: central,
  }

  return (
    <CentralContext.Provider value={centralState}>
      {children}
    </CentralContext.Provider>
  )
}

export default PeripheralProvider
