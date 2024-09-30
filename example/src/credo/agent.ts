import { AnonCredsCredentialFormatService, AnonCredsModule, AnonCredsProofFormatService } from '@credo-ts/anoncreds'
import { AskarModule } from '@credo-ts/askar'
import {
  Agent,
  AutoAcceptCredential,
  AutoAcceptProof,
  ConnectionsModule,
  ConsoleLogger,
  CredentialsModule,
  DidsModule,
  HttpOutboundTransport,
  LogLevel,
  MediationRecipientModule,
  ProofsModule,
  V2CredentialProtocol,
  V2ProofProtocol,
  WsOutboundTransport,
} from '@credo-ts/core'
import {
  IndyVdrAnonCredsRegistry,
  IndyVdrIndyDidRegistrar,
  IndyVdrIndyDidResolver,
  IndyVdrModule,
} from '@credo-ts/indy-vdr'
import { agentDependencies } from '@credo-ts/react-native'
import { anoncreds } from '@hyperledger/anoncreds-react-native'
import { ariesAskar } from '@hyperledger/aries-askar-react-native'
import { indyVdr } from '@hyperledger/indy-vdr-react-native'
import { BC_GOV_TEST_NET } from './utils/genesis'

export const setupAgent = async () => {
  const agent = new Agent({
    config: {
      label: 'react-native-ble-didcomm-agent',
      walletConfig: {
        id: 'react-native-ble-didcomm-agent',
        key: 'react-native-ble-didcomm-key',
      },
      logger: new ConsoleLogger(LogLevel.info),
    },
    modules: {
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
      proofs: new ProofsModule({
        autoAcceptProofs: AutoAcceptProof.ContentApproved,
        proofProtocols: [
          new V2ProofProtocol({
            proofFormats: [new AnonCredsProofFormatService()],
          }),
        ],
      }),
      mediationRecipient: new MediationRecipientModule({
        mediatorInvitationUrl:
          'https://mediator.dev.animo.id/invite?oob=eyJAdHlwZSI6Imh0dHBzOi8vZGlkY29tbS5vcmcvb3V0LW9mLWJhbmQvMS4xL2ludml0YXRpb24iLCJAaWQiOiIyMDc1MDM4YS05ZGU3LTRiODItYWUxYi1jNzBmNDg4MjYzYTciLCJsYWJlbCI6IkFuaW1vIE1lZGlhdG9yIiwiYWNjZXB0IjpbImRpZGNvbW0vYWlwMSIsImRpZGNvbW0vYWlwMjtlbnY9cmZjMTkiXSwiaGFuZHNoYWtlX3Byb3RvY29scyI6WyJodHRwczovL2RpZGNvbW0ub3JnL2RpZGV4Y2hhbmdlLzEuMCIsImh0dHBzOi8vZGlkY29tbS5vcmcvY29ubmVjdGlvbnMvMS4wIl0sInNlcnZpY2VzIjpbeyJpZCI6IiNpbmxpbmUtMCIsInNlcnZpY2VFbmRwb2ludCI6Imh0dHBzOi8vbWVkaWF0b3IuZGV2LmFuaW1vLmlkIiwidHlwZSI6ImRpZC1jb21tdW5pY2F0aW9uIiwicmVjaXBpZW50S2V5cyI6WyJkaWQ6a2V5Ono2TWtvSG9RTUphdU5VUE5OV1pQcEw3RGs1SzNtQ0NDMlBpNDJGY3FwR25iampMcSJdLCJyb3V0aW5nS2V5cyI6W119LHsiaWQiOiIjaW5saW5lLTEiLCJzZXJ2aWNlRW5kcG9pbnQiOiJ3c3M6Ly9tZWRpYXRvci5kZXYuYW5pbW8uaWQiLCJ0eXBlIjoiZGlkLWNvbW11bmljYXRpb24iLCJyZWNpcGllbnRLZXlzIjpbImRpZDprZXk6ejZNa29Ib1FNSmF1TlVQTk5XWlBwTDdEazVLM21DQ0MyUGk0MkZjcXBHbmJqakxxIl0sInJvdXRpbmdLZXlzIjpbXX1dfQ',
      }),
    },
    dependencies: agentDependencies,
  })

  agent.registerOutboundTransport(new HttpOutboundTransport())
  agent.registerOutboundTransport(new WsOutboundTransport())

  await agent.initialize()

  return agent
}

export type AppAgent = Awaited<ReturnType<typeof setupAgent>>
