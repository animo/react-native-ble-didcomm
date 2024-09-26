import { AskarModule } from '@credo-ts/askar'
import { Agent } from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/react-native'
import { ariesAskar } from '@hyperledger/aries-askar-react-native'

export const setupAgent = async () => {
  const agent = new Agent({
    config: {
      label: 'react-native-ble-didcomm-agent',
      walletConfig: { id: 'react-native-ble-didcomm-agent', key: 'react-native-ble-didcomm-key' },
    },
    modules: {
      askar: new AskarModule({ ariesAskar }),
    },
    dependencies: agentDependencies,
  })

  await agent.initialize()

  return agent
}

export type AppAgent = Awaited<ReturnType<typeof setupAgent>>
