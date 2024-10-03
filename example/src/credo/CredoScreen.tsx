import { Central, CentralProvider, Peripheral, PeripheralProvider } from '@animo-id/react-native-ble-didcomm'
import AgentProvider from '@credo-ts/react-hooks'
import CredentialProvider from '@credo-ts/react-hooks/build/CredentialProvider'
import ProofProvider from '@credo-ts/react-hooks/build/ProofProvider'
import * as React from 'react'
import { useState } from 'react'
import { Button, Text } from 'react-native'
import { Spacer } from '../Spacer'
import { Prover } from './Prover'
import { Verifier } from './Verifier'
import { type AppAgent, setupAgent } from './agent'

const uuid = 'd5477fcb-6e8b-4091-ad39-a1e30386ef76'

export const CredoScreen = () => {
  const [role, setRole] = useState<'prover' | 'verifier'>()
  const [agent, setAgent] = useState<AppAgent>()

  if (!role) {
    return (
      <>
        <Button
          title="prover"
          onPress={async () => {
            setRole('prover')
            const a = await setupAgent()
            setAgent(a)
          }}
        />
        <Spacer />
        <Button
          title="verifier"
          onPress={async () => {
            setRole('verifier')
            const a = await setupAgent()
            setAgent(a)
          }}
        />
      </>
    )
  }

  if (!agent) {
    return <Text>Setting up agent...</Text>
  }

  if (role === 'prover' && agent) {
    return (
      <AgentProvider agent={agent}>
        <CredentialProvider agent={agent}>
          <ProofProvider agent={agent}>
            <CentralProvider central={new Central()}>
              <Prover serviceUuid={uuid} />
            </CentralProvider>
          </ProofProvider>
        </CredentialProvider>
      </AgentProvider>
    )
  }

  if (role === 'verifier' && agent) {
    return (
      <AgentProvider agent={agent}>
        <ProofProvider agent={agent}>
          <PeripheralProvider peripheral={new Peripheral()}>
            <Verifier serviceUuid={uuid} />
          </PeripheralProvider>
        </ProofProvider>
      </AgentProvider>
    )
  }
}
