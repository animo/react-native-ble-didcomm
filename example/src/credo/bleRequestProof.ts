import {
  DEFAULT_DIDCOMM_INDICATE_CHARACTERISTIC_UUID,
  DEFAULT_DIDCOMM_MESSAGE_CHARACTERISTIC_UUID,
  type Peripheral,
} from '@animo-id/react-native-ble-didcomm'
import type { AnonCredsProofFormat } from '@credo-ts/anoncreds'
import {
  AutoAcceptProof,
  MessageReceiver,
  ProofEventTypes,
  type ProofExchangeRecord,
  type ProofFormatPayload,
  ProofState,
  type ProofStateChangedEvent,
} from '@credo-ts/core'
import { BleOutboundTransport } from '@credo-ts/transport-ble'
import type { AppAgent } from './agent'

export type PresentationTemplate = {
  id: string
  name: string
  requestMessage: ProofFormatPayload<[AnonCredsProofFormat], 'createRequest'>
}

export type BleRequestProofOptions = {
  agent: AppAgent
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

    await startPeripheral(peripheral, serviceUuid)

    disconnctedNotifier(agent, peripheral, onDisconnected)

    const proofRecordId = await sendMessageWhenConnected(
      agent,
      peripheral,
      presentationTemplate,
      serviceUuid,
      onConnected
    )

    const messageListener = startMessageReceiver(agent, peripheral)
    await returnWhenProofReceived(proofRecordId, agent)
    messageListener.remove()

    return proofRecordId
  } catch (e) {
    if (e instanceof Error) {
      agent.config.logger.error(e.message, { cause: e })
    } else {
      agent.config.logger.error(e)
    }

    onFailure()
  } finally {
    await shutdownProcess(agent, peripheral)
  }
}

const startBleTransport = async (agent: AppAgent, peripheral: Peripheral) => {
  const bleOutboundTransport = new BleOutboundTransport(peripheral)
  agent.registerOutboundTransport(bleOutboundTransport)
  await bleOutboundTransport.start(agent)
}

const startPeripheral = async (peripheral: Peripheral, serviceUuid: string) => {
  await peripheral.start()

  await peripheral.setService({
    serviceUUID: serviceUuid,
    messagingUUID: DEFAULT_DIDCOMM_MESSAGE_CHARACTERISTIC_UUID,
    indicationUUID: DEFAULT_DIDCOMM_INDICATE_CHARACTERISTIC_UUID,
  })

  await peripheral.advertise()
}

const shutdownProcess = async (agent: AppAgent, peripheral: Peripheral) => {
  for (const ot of agent.outboundTransports) {
    if (ot instanceof BleOutboundTransport) {
      void agent.unregisterOutboundTransport(ot)
    }
  }

  await peripheral.shutdown()
}

const sendMessageWhenConnected = async (
  agent: AppAgent,
  peripheral: Peripheral,
  presentationTemplate: PresentationTemplate,
  serviceUuid: string,
  onConnectedListener: () => Promise<void> | void
) =>
  new Promise<string>((resolve) => {
    const connectedListener = peripheral.registerOnConnectedListener(async () => {
      await onConnectedListener()
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

const disconnctedNotifier = (agent: AppAgent, peripheral: Peripheral, onDisconnected: () => Promise<void> | void) => {
  const disconnectedListener = peripheral.registerOnDisconnectedListener(async ({ identifier }) => {
    agent.config.logger.info(`[PERIPHERAL]: Disconnected from device ${identifier}`)
    await onDisconnected()
    disconnectedListener.remove()
  })
}

// TODO: is this required?
const startMessageReceiver = (agent: AppAgent, peripheral: Peripheral) => {
  const messageReceiver = agent.dependencyManager.resolve(MessageReceiver)
  return peripheral.registerMessageListener(async ({ message }) => {
    agent.config.logger.info(`[PERIPHERAL]: received message ${message.slice(0, 16)}...`)
    await messageReceiver.receiveMessage(JSON.parse(message))
  })
}

const returnWhenProofReceived = (id: string, agent: AppAgent): Promise<ProofExchangeRecord> => {
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

const createBleProofRequestMessage = async (
  agent: AppAgent,
  requestMessage: PresentationTemplate['requestMessage'],
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
