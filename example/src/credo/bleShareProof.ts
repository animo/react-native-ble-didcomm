import {
  type Central,
  DEFAULT_DIDCOMM_INDICATE_CHARACTERISTIC_UUID,
  DEFAULT_DIDCOMM_MESSAGE_CHARACTERISTIC_UUID,
} from '@animo-id/react-native-ble-didcomm'
import {
  type Agent,
  JsonTransformer,
  OutOfBandInvitation,
  ProofEventTypes,
  type ProofExchangeRecord,
  ProofRepository,
  ProofState,
  type ProofStateChangedEvent,
} from '@credo-ts/core'
import { BleInboundTransport, BleOutboundTransport } from '@credo-ts/transport-ble'
import type { AppAgent } from './agent'

const METADATA_KEY_FORMAT_DATA = 'FORMAT_DATA'

export type BleShareProofOptions = {
  agent: AppAgent
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

    await startCentral(central, serviceUuid)

    disconnctedNotifier(agent, central, onDisconnected)

    await discoverAndConnect(agent, central)

    await connectedNotifier(agent, central, onConnected)

    await shareProof(agent, central, serviceUuid)
  } catch (e) {
    if (e instanceof Error) {
      agent.config.logger.error(e.message, { cause: e })
    } else {
      agent.config.logger.error(e)
    }

    onFailure()
  } finally {
    await shutdownProcess(agent, central)
  }
}

const startBleTransport = async (agent: AppAgent, central: Central) => {
  const bleInboundTransport = new BleInboundTransport(central)
  agent.registerInboundTransport(bleInboundTransport)
  await bleInboundTransport.start(agent)
  const bleOutboundTransport = new BleOutboundTransport(central)
  agent.registerOutboundTransport(bleOutboundTransport)
  await bleOutboundTransport.start(agent)
}

const startCentral = async (central: Central, serviceUuid: string) => {
  await central.start()
  await central.setService({
    serviceUUID: serviceUuid,
    messagingUUID: DEFAULT_DIDCOMM_MESSAGE_CHARACTERISTIC_UUID,
    indicationUUID: DEFAULT_DIDCOMM_INDICATE_CHARACTERISTIC_UUID,
  })
  await central.scan()
}

const discoverAndConnect = async (agent: AppAgent, central: Central) =>
  await new Promise<void>((resolve) => {
    const listener = central.registerOnDiscoveredListener(({ identifier, name }) => {
      agent.config.logger.info(`[CENTRAL]: Discovered device ${name ? `(${name})` : ''}: ${identifier}`)

      central.connect(identifier).then(() => {
        listener.remove()
        resolve()
      })
    })
  })

const connectedNotifier = async (agent: AppAgent, central: Central, onConnected?: () => Promise<void> | void) =>
  new Promise<void>((resolve) => {
    const connectedListener = central.registerOnConnectedListener(async ({ identifier, name }) => {
      agent.config.logger.info(`[CENTRAL]: Connected to device ${name ? `(${name})` : ''}: ${identifier}`)
      await onConnected()
      connectedListener.remove()
      resolve()
    })
  })

const disconnctedNotifier = (agent: Agent, central: Central, onDisconnected: () => Promise<void> | void) => {
  const disconnectedListener = central.registerOnDisconnectedListener(async ({ identifier }) => {
    agent.config.logger.info(`[CENTRAL]: Disconnected from device ${identifier}`)
    await onDisconnected()
    disconnectedListener.remove()
  })
}

const shutdownProcess = async (agent: Agent, central: Central) => {
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

  await central.shutdown()
}

const shareProof = async (agent: AppAgent, central: Central, serviceUuid: string) =>
  new Promise<void>((resolve) => {
    const receivedMessageListener = central.registerMessageListener(async ({ message }) => {
      agent.config.logger.info(`[CENTRAL]: received message ${message.slice(0, 16)}...`)

      const parsedMessage = JsonTransformer.deserialize(message, OutOfBandInvitation)

      const responder = autoRespondToBleProofRequest(agent)

      const routing = await agent.mediationRecipient.getRouting({
        useDefaultMediator: false,
      })

      await agent.oob.receiveInvitation(parsedMessage, {
        routing: { ...routing, endpoints: [`ble://${serviceUuid}`] },
      })

      const { id } = await responder

      await waitForSharedProof(id, agent)

      receivedMessageListener.remove()
      resolve()
    })
  })

const autoRespondToBleProofRequest = (agent: AppAgent): Promise<ProofExchangeRecord> => {
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

const waitForSharedProof = (id: string, agent: AppAgent): Promise<ProofExchangeRecord> =>
  new Promise((resolve, reject) => {
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
