import { ProofEventTypes, type ProofExchangeRecord, ProofState, type ProofStateChangedEvent } from '@credo-ts/core'
import type { AppAgent } from '../agent'

export const returnWhenProofShared = (id: string, agent: AppAgent): Promise<ProofExchangeRecord> => {
  return new Promise((resolve, reject) => {
    const listener = ({ payload }: ProofStateChangedEvent) => {
      const off = () => agent.events.off(ProofEventTypes.ProofStateChanged, listener)
      if (payload.proofRecord.id === id) {
        if (payload.proofRecord.state === ProofState.PresentationReceived) {
          off()
          resolve(payload.proofRecord)
        } else if ([ProofState.Abandoned, ProofState.Declined].includes(payload.proofRecord.state)) {
          off()
          reject(new Error(`Proof could not be shared because it has been ${payload.proofRecord.state}`))
        }
      }
    }
    agent.events.on<ProofStateChangedEvent>(ProofEventTypes.ProofStateChanged, listener)
  })
}
