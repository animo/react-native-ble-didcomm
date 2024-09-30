import {
  ProofEventTypes,
  type ProofExchangeRecord,
  ProofRepository,
  ProofState,
  type ProofStateChangedEvent,
} from '@credo-ts/core'
import type { AppAgent } from '../agent'

export const METADATA_KEY_FORMAT_DATA = 'FORMAT_DATA'

export const autoRespondToBleProofRequest = (agent: AppAgent): Promise<ProofExchangeRecord> => {
  return new Promise((resolve, reject) => {
    const listener = async ({ payload: { proofRecord } }: ProofStateChangedEvent) => {
      if (proofRecord.state === ProofState.RequestReceived) {
        const formatData = await agent.proofs.getFormatData(proofRecord.id)

        if (!formatData.request?.anoncreds) {
          reject('Proof request does not contain anoncreds request')
          return
        }

        await agent.proofs.acceptRequest({ proofRecordId: proofRecord.id })

        resolve(proofRecord)
      } else if (proofRecord.state === ProofState.Done || proofRecord.state === ProofState.PresentationSent) {
        const formatData = await agent.proofs.getFormatData(proofRecord.id)
        const proofRepository = agent.dependencyManager.resolve(ProofRepository)
        proofRecord.metadata.set(METADATA_KEY_FORMAT_DATA, formatData)
        await proofRepository.update(agent.context, proofRecord)
        agent.events.off(ProofEventTypes.ProofStateChanged, listener)
        resolve(proofRecord)
      }
    }
    agent.events.on<ProofStateChangedEvent>(ProofEventTypes.ProofStateChanged, listener)
  })
}
