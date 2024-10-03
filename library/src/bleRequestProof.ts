import type { AnonCredsProofFormat } from '@credo-ts/anoncreds'
import {
  type Agent,
  AutoAcceptProof,
  JsonTransformer,
  MessageReceiver,
  ProofEventTypes,
  type ProofExchangeRecord,
  type ProofFormatPayload,
  ProofState,
  type ProofStateChangedEvent,
} from '@credo-ts/core'
import { BleOutboundTransport } from '@credo-ts/transport-ble'
import { DEFAULT_DIDCOMM_INDICATE_CHARACTERISTIC_UUID, DEFAULT_DIDCOMM_MESSAGE_CHARACTERISTIC_UUID } from './constants'
import type { Peripheral } from './peripheral'

export type PresentationTemplate = {
  id: string
  name: string
  requestMessage: ProofFormatPayload<[AnonCredsProofFormat], 'createRequest'>
}

export type BleRequestProofOptions = {
  agent: Agent
  peripheral: Peripheral
  serviceUuid: string
  presentationTemplate: PresentationTemplate
  onFailure: () => Promise<void> | void
  onConnected?: () => Promise<void> | void
  onDisconnected?: () => Promise<void> | void
}

export const bleRequestProof = async ({
  peripheral,
  agent,
  serviceUuid,
  presentationTemplate,
  onFailure,
  onConnected,
  onDisconnected,
}: BleRequestProofOptions) => {
  try {
    await startBleTransport(agent, peripheral)

    await startPeripheral(peripheral, agent, serviceUuid)

    disconnctedNotifier(agent, peripheral, onDisconnected)

    const proofRecordId = await sendMessageWhenConnected(
      agent,
      peripheral,
      presentationTemplate,
      serviceUuid,
      onConnected
    )

    const messageListener = startMessageReceiver(agent, peripheral)
    await returnWhenProofReceived(proofRecordId, agent, peripheral)
    messageListener.remove()

    return proofRecordId
  } catch (e) {
    if (e instanceof Error) {
      agent.config.logger.error(e.message, { cause: e })
    } else {
      agent.config.logger.error(e as string)
    }
    onFailure()
    throw e
  }
}

const startBleTransport = async (agent: Agent, peripheral: Peripheral) => {
  const bleOutboundTransport = new BleOutboundTransport(peripheral)
  agent.registerOutboundTransport(bleOutboundTransport)
  await bleOutboundTransport.start(agent)
}

const startPeripheral = async (peripheral: Peripheral, agent: Agent, serviceUuid: string) => {
  await peripheral.start()

  await peripheral.setService({
    serviceUUID: serviceUuid,
    messagingUUID: DEFAULT_DIDCOMM_MESSAGE_CHARACTERISTIC_UUID,
    indicationUUID: DEFAULT_DIDCOMM_INDICATE_CHARACTERISTIC_UUID,
  })

  await peripheral.advertise()
  agent.config.logger.info(`[PERIPHERAL]: Advertising on service UUID '${serviceUuid}'`)
}

const sendMessageWhenConnected = async (
  agent: Agent,
  peripheral: Peripheral,
  presentationTemplate: PresentationTemplate,
  serviceUuid: string,
  onConnected?: () => Promise<void> | void
) =>
  new Promise<string>((resolve) => {
    const connectedListener = peripheral.registerOnConnectedListener(async () => {
      if (onConnected) await onConnected()
      const { message, proofRecordId } = await createBleProofRequestMessage(
        agent,
        presentationTemplate.requestMessage,
        serviceUuid
      )
      await peripheral.sendMessage(message)
      connectedListener.remove()
      resolve(proofRecordId)
    })
  })

const disconnctedNotifier = (agent: Agent, peripheral: Peripheral, onDisconnected?: () => Promise<void> | void) => {
  const disconnectedListener = peripheral.registerOnDisconnectedListener(async ({ identifier }) => {
    agent.config.logger.info(`[PERIPHERAL]: Disconnected from device ${identifier}`)
    if (onDisconnected) await onDisconnected()
    disconnectedListener.remove()
  })
}

// TODO: is this required?
const startMessageReceiver = (agent: Agent, peripheral: Peripheral) => {
  const messageReceiver = agent.dependencyManager.resolve(MessageReceiver)
  return peripheral.registerMessageListener(async ({ message }) => {
    agent.config.logger.info(`[PERIPHERAL]: received message ${message.slice(0, 16)}...`)
    await messageReceiver.receiveMessage(JSON.parse(message))
  })
}

const returnWhenProofReceived = (id: string, agent: Agent, peripheral: Peripheral): Promise<ProofExchangeRecord> => {
  return new Promise((resolve, reject) => {
    const listener = async ({ payload: { proofRecord } }: ProofStateChangedEvent) => {
      const off = () => agent.events.off(ProofEventTypes.ProofStateChanged, listener)
      if (proofRecord.id !== id) return
      if (proofRecord.state === ProofState.PresentationReceived) {
        console.log('')
        const proofProtocol = agent.proofs.config.proofProtocols.find((pp) => pp.version === 'v2')
        if (!proofProtocol) throw new Error('No V2 proof protocol registered on the agent')
        const { message } = await proofProtocol.acceptPresentation(agent.context, { proofRecord })
        const serializedMessage = JsonTransformer.serialize(message)
        await peripheral.sendMessage(serializedMessage)
      } else if (proofRecord.state === ProofState.Done) {
        off()
        resolve(proofRecord)
      } else if ([ProofState.Abandoned, ProofState.Declined].includes(proofRecord.state)) {
        off()
        reject(new Error(`Proof could not be shared because it has been ${proofRecord.state}`))
      }
    }
    agent.events.on<ProofStateChangedEvent>(ProofEventTypes.ProofStateChanged, listener)
  })
}

const createBleProofRequestMessage = async (
  agent: Agent,
  requestMessage: PresentationTemplate['requestMessage'],
  serviceUuid: string
) => {
  const { proofRecord, message } = await agent.proofs.createRequest({
    proofFormats: requestMessage,
    protocolVersion: 'v2',
    autoAcceptProof: AutoAcceptProof.Never,
  })

  const routing = await agent.mediationRecipient.getRouting({
    useDefaultMediator: false,
  })
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
