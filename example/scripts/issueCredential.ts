import { AnonCredsCredentialFormatService, AnonCredsModule } from '@credo-ts/anoncreds'
import { AskarModule } from '@credo-ts/askar'
import {
  Agent,
  AutoAcceptCredential,
  ConnectionEventTypes,
  type ConnectionStateChangedEvent,
  ConnectionsModule,
  ConsoleLogger,
  CredentialEventTypes,
  CredentialState,
  type CredentialStateChangedEvent,
  CredentialsModule,
  DidExchangeState,
  DidsModule,
  HttpOutboundTransport,
  KeyType,
  LogLevel,
  TypedArrayEncoder,
  V2CredentialProtocol,
  WsOutboundTransport,
} from '@credo-ts/core'
import {
  IndyVdrAnonCredsRegistry,
  IndyVdrIndyDidRegistrar,
  IndyVdrIndyDidResolver,
  IndyVdrModule,
} from '@credo-ts/indy-vdr'
import { HttpInboundTransport, agentDependencies } from '@credo-ts/node'
import { anoncreds } from '@hyperledger/anoncreds-nodejs'
import { ariesAskar } from '@hyperledger/aries-askar-nodejs'
import { indyVdr } from '@hyperledger/indy-vdr-nodejs'
import QRCode from 'qrcode'
import { BC_GOV_TEST_NET } from '../src/credo/utils/genesis'

const modules = {
  askar: new AskarModule({ ariesAskar }),
  indyVdr: new IndyVdrModule({
    indyVdr,
    networks: [
      {
        isProduction: false,
        indyNamespace: 'bcovrin:test',
        genesisTransactions: BC_GOV_TEST_NET,
      },
    ],
  }),
  anoncreds: new AnonCredsModule({
    anoncreds,
    registries: [new IndyVdrAnonCredsRegistry()],
  }),
  dids: new DidsModule({
    resolvers: [new IndyVdrIndyDidResolver()],
    registrars: [new IndyVdrIndyDidRegistrar()],
  }),
  connections: new ConnectionsModule({ autoAcceptConnections: true }),
  credentials: new CredentialsModule({
    autoAcceptCredentials: AutoAcceptCredential.Always,
    credentialProtocols: [
      new V2CredentialProtocol({
        credentialFormats: [new AnonCredsCredentialFormatService()],
      }),
    ],
  }),
}

void (async () => {
  const agent = new Agent({
    config: {
      label: 'nodejs-register-agent',
      walletConfig: { id: 'nodejs-register-agent', key: 'nodejs-register-key' },
      logger: new ConsoleLogger(LogLevel.off),
      endpoints: ['https://36ba-161-51-75-238.ngrok-free.app'],
    },
    modules,
    dependencies: agentDependencies,
  })

  agent.registerOutboundTransport(new WsOutboundTransport())
  agent.registerOutboundTransport(new HttpOutboundTransport())
  agent.registerInboundTransport(new HttpInboundTransport({ port: 3001 }))

  await agent.initialize()

  const { outOfBandInvitation } = await agent.oob.createInvitation()
  const url = outOfBandInvitation.toUrl({ domain: 'https://example.org' })
  const qrcode = await QRCode.toString(url, { type: 'terminal', small: true })
  console.log(qrcode)

  agent.events.on<ConnectionStateChangedEvent>(
    ConnectionEventTypes.ConnectionStateChanged,
    async ({ payload: { connectionRecord } }) => {
      console.log(`NEW CONNECTION STATE: ${connectionRecord.state}`)
      if (connectionRecord.state === DidExchangeState.Completed) {
        await issue(agent, connectionRecord.id)
      }
    }
  )

  agent.events.on<CredentialStateChangedEvent>(
    CredentialEventTypes.CredentialStateChanged,
    async ({ payload: { credentialRecord } }) => {
      console.log(`NEW CREDENTIAL STATE: ${credentialRecord.state}`)
      if (credentialRecord.state === CredentialState.Done) {
        console.log('Issued credential!')
        process.exit(0)
      }
    }
  )
})()

const issue = async (agent: Agent<typeof modules>, connectionId: string) => {
  const seed = TypedArrayEncoder.fromString('abbakabba00000000000000000000000')
  const unqualifiedIndyDid = 'NyKUCBjGVmmaUopiXAnLpj'
  const indyDid = `did:indy:bcovrin:test:${unqualifiedIndyDid}`
  await agent.dids.import({
    did: indyDid,
    overwrite: true,
    privateKeys: [{ keyType: KeyType.Ed25519, privateKey: seed }],
  })

  const schemaResult = await agent.modules.anoncreds.registerSchema({
    schema: {
      name: 'react-native-ble-didcomm-schema',
      version: `1.0.${Date.now()}`,
      attrNames: ['name', 'age'],
      issuerId: indyDid,
    },
    options: {},
  })

  if (schemaResult.schemaState.state === 'failed') {
    throw new Error(`Error creating schema: ${schemaResult.schemaState.reason}`)
  }

  console.log('registered schema')

  const credentialDefinitionResult = await agent.modules.anoncreds.registerCredentialDefinition({
    credentialDefinition: {
      tag: 'default',
      issuerId: indyDid,
      schemaId: schemaResult.schemaState.schemaId,
    },
    options: {
      supportRevocation: false,
    },
  })

  if (credentialDefinitionResult.credentialDefinitionState.state === 'failed') {
    throw new Error(
      `Error creating credential definition: ${credentialDefinitionResult.credentialDefinitionState.reason}`
    )
  }

  if (!credentialDefinitionResult.credentialDefinitionState.credentialDefinitionId) {
    throw new Error('Could not find credential definition id on state')
  }

  console.log('registered credential definition!')

  await agent.credentials.offerCredential({
    protocolVersion: 'v2',
    connectionId: connectionId,
    credentialFormats: {
      anoncreds: {
        credentialDefinitionId: credentialDefinitionResult.credentialDefinitionState.credentialDefinitionId,
        attributes: [
          { name: 'name', value: 'Jane Doe' },
          { name: 'age', value: '23' },
        ],
      },
    },
  })
}
