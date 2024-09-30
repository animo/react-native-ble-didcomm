import {
  type PresentationTemplate,
  bleRequestProof,
  useCloseTransportsOnUnmount,
  usePeripheral,
  usePeripheralShutdownOnUnmount,
} from '@animo-id/react-native-ble-didcomm'
import type { Agent } from '@credo-ts/core'
import type React from 'react'
import { useState } from 'react'
import { Button, Text, View } from 'react-native'
import { Spacer } from '../Spacer'

type BleVerifierProps = {
  agent: Agent
  serviceUuid: string
}

const presentationTemplate: PresentationTemplate = {
  id: 'test',
  name: 'my-proof-request',
  requestMessage: {
    anoncreds: {
      name: 'anon-request',
      version: '2.0',
      requested_attributes: { nameGroup: { name: 'name' } },
      requested_predicates: {
        ageGroup: { name: 'age', p_value: 20, p_type: '>' },
      },
    },
  },
}

export const BleVerifier: React.FC<BleVerifierProps> = ({ agent, serviceUuid }) => {
  const [hasReceivedProof, setHasReceivedProof] = useState(false)
  const { peripheral } = usePeripheral()

  const onFailure = () => console.error('[PERIPHEAL]: failure')
  const onConnected = () => console.log('[PERIPHERAL]: connected')
  const onDisconnected = () => console.log('[PERIPHERAL]: disconnected')

  usePeripheralShutdownOnUnmount()
  useCloseTransportsOnUnmount(agent)

  const requestProof = () =>
    bleRequestProof({
      onConnected,
      onDisconnected,
      onFailure,
      peripheral,
      agent,
      serviceUuid,
      presentationTemplate,
    }).then(() => setHasReceivedProof(true))

  return (
    <View>
      <Text>Ble Verifier</Text>
      <Spacer />
      <Button title="Request a proof" onPress={requestProof} />
      <Spacer />
      <Text>Proof has{hasReceivedProof ? ' ' : ' not '}been received!</Text>
    </View>
  )
}
