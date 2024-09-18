import type { PropsWithChildren } from 'react'
import { useContext } from 'react'
import * as React from 'react'
import type { Central } from './central'

interface CentralContextItems {
  central: Central
}

const CentralContext = React.createContext<CentralContextItems | undefined>(undefined)

export const useCentral = () => {
  const centralContext = useContext(CentralContext)
  if (!centralContext) {
    throw new Error('Central hook is not called within the CentralProvider')
  }
  return centralContext
}

export const CentralProvider: React.FC<PropsWithChildren<{ central: Central }>> = ({ central, children }) => {
  return <CentralContext.Provider value={{ central }}>{children}</CentralContext.Provider>
}
