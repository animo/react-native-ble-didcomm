import * as React from 'react'
import { type ReactElement, useEffect, useState } from 'react'
import { Button, Text } from 'react-native'
import { Spacer } from '../Spacer'
import { Issuer } from './Issuer'
import { Verifier } from './Verifier'
import { type AppAgent, setupAgent } from './agent'

export const CredoScreen = () => {
  const [role, setRole] = useState<'issuer' | 'verifier'>()
  const [agent, setAgent] = useState<AppAgent>()

  useEffect(() => {
    setupAgent().then(setAgent)
  }, [])

  let component: ReactElement

  if (!role) {
    component = (
      <>
        <Button title="issuer" onPress={() => setRole('issuer')} />
        <Spacer />
        <Button title="verifier" onPress={() => setRole('verifier')} />
      </>
    )
  }

  if (!agent) {
    component = <Text>Setting up agent...</Text>
  }

  if (role === 'issuer' && agent) {
    component = <Issuer agent={agent} />
  }

  if (role === 'verifier' && agent) {
    component = <Verifier agent={agent} />
  }

  return component
}
