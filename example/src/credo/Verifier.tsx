import { type FunctionComponent, type ReactElement, useState } from 'react'
import { Button, Text } from 'react-native'
import { BleVerifier } from './BleVerifier'
import type { AppAgent } from './agent'

type VerifierProps = {
  agent: AppAgent
  serviceUuid: string
}

export const Verifier: FunctionComponent<VerifierProps> = ({ agent, serviceUuid }) => {
  const [bleFlowInProgress, setBleFlowInProgress] = useState(false)

  let component: ReactElement

  if (bleFlowInProgress) {
    component = (
      <>
        <Button title="quit ble flow" onPress={() => setBleFlowInProgress(false)} />
        <BleVerifier agent={agent} serviceUuid={serviceUuid} />
      </>
    )
  }

  if (!bleFlowInProgress) {
    component = (
      <>
        <Text>Verifier</Text>
        <Button title="request proof" onPress={() => setBleFlowInProgress(true)} />
      </>
    )
  }

  return component
}
