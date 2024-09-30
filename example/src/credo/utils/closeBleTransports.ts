import { BleInboundTransport, BleOutboundTransport } from '@credo-ts/transport-ble'
import type { AppAgent } from '../agent'

export const closeBleTransports = (agent: AppAgent) => {
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
