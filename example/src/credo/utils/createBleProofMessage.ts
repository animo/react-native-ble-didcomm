import type {
  AnonCredsProof,
  AnonCredsProofFormat,
  AnonCredsProposeProofFormat,
  AnonCredsRequestProofFormat,
} from '@credo-ts/anoncreds'
import { AutoAcceptProof, type ProofFormatPayload } from '@credo-ts/core'
import type { AppAgent } from '../agent'

export type RequestMessage = ProofFormatPayload<[AnonCredsProofFormat], 'createRequest'>

export type ProofTemplate = {
  id: string
  name: string
  requestMessage: RequestMessage
}

export type FormattedProof = {
  proposal: {
    anoncreds?: AnonCredsProposeProofFormat
  }
  request: {
    anoncreds?: AnonCredsRequestProofFormat
  }
  presentation: {
    anoncreds?: AnonCredsProof
  }
}

export const createBleProofRequestMessage = async (
  agent: AppAgent,
  requestMessage: RequestMessage,
  serviceUuid: string
) => {
  const { proofRecord, message } = await agent.proofs.createRequest({
    proofFormats: requestMessage,
    protocolVersion: 'v2',
    autoAcceptProof: AutoAcceptProof.Always,
  })

  const routing = await agent.mediationRecipient.getRouting({ useDefaultMediator: false })
  routing.endpoints = [`ble://${serviceUuid}`]
  const { outOfBandInvitation } = await agent.oob.createInvitation({
    routing,
    handshake: false,
    messages: [message],
  })

  return {
    message: JSON.stringify(outOfBandInvitation.toJSON()),
    proofRecordId: proofRecord.id,
  }
}
