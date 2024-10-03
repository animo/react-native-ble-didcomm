import { useAgent } from '@credo-ts/react-hooks'
import { type FunctionComponent, type ReactElement, useState } from 'react'
import { Button, Text } from 'react-native'
import { BleVerifier } from './BleVerifier'

type VerifierProps = {
  serviceUuid: string
}

export const Verifier: FunctionComponent<VerifierProps> = ({ serviceUuid }) => {
  const [bleFlowInProgress, setBleFlowInProgress] = useState(false)
  const { agent } = useAgent()

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
