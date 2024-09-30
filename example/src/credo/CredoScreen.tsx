import { Central, CentralProvider, Peripheral, PeripheralProvider } from '@animo-id/react-native-ble-didcomm'
import AgentProvider from '@credo-ts/react-hooks'
import CredentialProvider from '@credo-ts/react-hooks/build/CredentialProvider'
import ProofProvider from '@credo-ts/react-hooks/build/ProofProvider'
import * as React from 'react'
import { type ReactElement, useEffect, useState } from 'react'
import { Button, Text } from 'react-native'
import { Spacer } from '../Spacer'
import { Prover } from './Prover'
import { Verifier } from './Verifier'
import { type AppAgent, setupAgent } from './agent'

const uuid = 'd5477fcb-6e8b-4091-ad39-a1e30386ef76'

export const CredoScreen = () => {
  const [role, setRole] = useState<'prover' | 'verifier'>()
  const [agent, setAgent] = useState<AppAgent>()

  useEffect(() => {
    setupAgent().then(setAgent)
  }, [])

  let component: ReactElement

  if (!role) {
    component = (
      <>
        <Button title="prover" onPress={() => setRole('prover')} />
        <Spacer />
        <Button title="verifier" onPress={() => setRole('verifier')} />
      </>
    )
  }

  if (!agent) {
    component = <Text>Setting up agent...</Text>
  }

  if (role === 'prover' && agent) {
    component = (
      <AgentProvider agent={agent}>
        <CredentialProvider agent={agent}>
          <ProofProvider agent={agent}>
            <CentralProvider central={new Central()}>
              <Prover agent={agent} serviceUuid={uuid} />
            </CentralProvider>
          </ProofProvider>
        </CredentialProvider>
      </AgentProvider>
    )
  }

  if (role === 'verifier' && agent) {
    component = (
      <AgentProvider agent={agent}>
        <ProofProvider agent={agent}>
          <PeripheralProvider peripheral={new Peripheral()}>
            <Verifier agent={agent} serviceUuid={uuid} />
          </PeripheralProvider>
        </ProofProvider>
      </AgentProvider>
    )
  }

  return component
}
