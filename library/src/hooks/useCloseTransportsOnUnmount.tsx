import type { Agent } from '@credo-ts/core'
import { BleInboundTransport, BleOutboundTransport } from '@credo-ts/transport-ble'
import { useEffect } from 'react'

export const useCloseTransportsOnUnmount = (agent: Agent) =>
  useEffect(() => {
    return () => {
      for (const it of agent.inboundTransports) {
        if (it instanceof BleInboundTransport) {
          void agent.unregisterInboundTransport(it)
        }
      }

      for (const ot of agent.outboundTransports) {
        if (ot instanceof BleOutboundTransport) {
          void agent.unregisterOutboundTransport(ot)
        }
      }
    }
  }, [
    agent.unregisterOutboundTransport,
    agent.unregisterInboundTransport,
    agent.inboundTransports,
    agent.outboundTransports,
  ])
