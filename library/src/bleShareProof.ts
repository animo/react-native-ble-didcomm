import {
  type Agent,
  JsonTransformer,
  OutOfBandInvitation,
  ProofEventTypes,
  type ProofExchangeRecord,
  ProofRepository,
  ProofState,
  type ProofStateChangedEvent,
  V2PresentationAckMessage,
} from '@credo-ts/core'
import { BleInboundTransport, BleOutboundTransport } from '@credo-ts/transport-ble'
import type { Central } from './central'
import { DEFAULT_DIDCOMM_INDICATE_CHARACTERISTIC_UUID, DEFAULT_DIDCOMM_MESSAGE_CHARACTERISTIC_UUID } from './constants'

export type BleShareProofOptions = {
  agent: Agent
  central: Central
  serviceUuid: string
  onFailure: () => Promise<void> | void
  onConnected?: () => Promise<void> | void
  onDisconnected?: () => Promise<void> | void
}

// TODO: would be nice to have a rejection timeout here
export const bleShareProof = async ({
  agent,
  central,
  serviceUuid,
  onFailure,
  onConnected,
  onDisconnected,
}: BleShareProofOptions) => {
  try {
    await startBleTransport(agent, central)

    await startCentral(central, agent, serviceUuid)

    disconnectedNotifier(agent, central, onDisconnected)

    await discoverAndConnect(agent, central)

    await connectedNotifier(agent, central, onConnected)

    const proofRecord = await shareProof(agent, central, serviceUuid)
    await handleAck(agent, central, proofRecord)
    return proofRecord.id
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

const startBleTransport = async (agent: Agent, central: Central) => {
  const bleInboundTransport = new BleInboundTransport(central)
  agent.registerInboundTransport(bleInboundTransport)
  await bleInboundTransport.start(agent)
  const bleOutboundTransport = new BleOutboundTransport(central)
  agent.registerOutboundTransport(bleOutboundTransport)
  await bleOutboundTransport.start(agent)
}

const startCentral = async (central: Central, agent: Agent, serviceUuid: string) => {
  await central.start()
  await central.setService({
    serviceUUID: serviceUuid,
    messagingUUID: DEFAULT_DIDCOMM_MESSAGE_CHARACTERISTIC_UUID,
    indicationUUID: DEFAULT_DIDCOMM_INDICATE_CHARACTERISTIC_UUID,
  })
  await central.scan()
  agent.config.logger.info(`[CENTRAL]: Scanning on service UUID '${serviceUuid}'`)
}

const discoverAndConnect = async (agent: Agent, central: Central) =>
  await new Promise<void>((resolve) => {
    const listener = central.registerOnDiscoveredListener(({ identifier, name }) => {
      agent.config.logger.info(`[CENTRAL]: Discovered device ${name ? `(${name})` : ''}: ${identifier}`)

      central.connect(identifier).then(() => {
        listener.remove()
        resolve()
      })
    })
  })

const connectedNotifier = async (agent: Agent, central: Central, onConnected?: () => Promise<void> | void) =>
  new Promise<void>((resolve) => {
    const connectedListener = central.registerOnConnectedListener(async ({ identifier, name }) => {
      agent.config.logger.info(`[CENTRAL]: Connected to device ${name ? `(${name})` : ''}: ${identifier}`)
      if (onConnected) await onConnected()
      connectedListener.remove()
      resolve()
    })
  })

const disconnectedNotifier = (agent: Agent, central: Central, onDisconnected?: () => Promise<void> | void) => {
  const disconnectedListener = central.registerOnDisconnectedListener(async ({ identifier }) => {
    agent.config.logger.info(`[CENTRAL]: Disconnected from device ${identifier}`)
    if (onDisconnected) await onDisconnected()
    disconnectedListener.remove()
  })
}

const shareProof = async (agent: Agent, central: Central, serviceUuid: string) =>
  new Promise<ProofExchangeRecord>((resolve) => {
    const receivedMessageListener = central.registerMessageListener(async ({ message }) => {
      agent.config.logger.info(`[CENTRAL]: received message ${message.slice(0, 16)}...`)

      const parsedMessage = JsonTransformer.deserialize(message, OutOfBandInvitation)

      const routing = await agent.mediationRecipient.getRouting({
        useDefaultMediator: false,
      })

      await agent.oob.receiveInvitation(parsedMessage, {
        routing: { ...routing, endpoints: [`ble://${serviceUuid}`] },
      })

      const proofExchangeRecord = await autoRespondToBleProofRequest(agent)

      receivedMessageListener.remove()
      resolve(proofExchangeRecord)
    })
  })

const autoRespondToBleProofRequest = (agent: Agent): Promise<ProofExchangeRecord> => {
  return new Promise((resolve, reject) => {
    const listener = async ({ payload: { proofRecord } }: ProofStateChangedEvent) => {
      const off = () => agent.events.off(ProofEventTypes.ProofStateChanged, listener)
      if (proofRecord.state === ProofState.RequestReceived) {
        const formatData = await agent.proofs.getFormatData(proofRecord.id)

        if (!formatData.request || !('anoncreds' in formatData.request)) {
          reject(new Error('Proof request does not contain anoncreds request'))
          return
        }

        await agent.proofs.acceptRequest({ proofRecordId: proofRecord.id })
        resolve(proofRecord)
        off()
      }
    }
    agent.events.on<ProofStateChangedEvent>(ProofEventTypes.ProofStateChanged, listener)
  })
}

const handleAck = async (agent: Agent, central: Central, proofRecord: ProofExchangeRecord) =>
  new Promise<void>((resolve) => {
    const listener = central.registerMessageListener(async ({ message }) => {
      if (!message.includes('@type')) throw new Error(`Received invalid message '${message}'`)

      const deserializedMessage = JsonTransformer.deserialize(message, V2PresentationAckMessage)
      if (deserializedMessage.threadId !== proofRecord.threadId) throw new Error('Received Ack with invalid thread id')

      const proofRepository = agent.dependencyManager.resolve(ProofRepository)
      proofRecord.state = ProofState.Done
      await proofRepository.update(agent.context, proofRecord)

      listener.remove()
      resolve()
    })
  })
