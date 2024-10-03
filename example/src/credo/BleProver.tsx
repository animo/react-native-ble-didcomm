import {
  bleShareProof,
  useCentral,
  useCentralShutdownOnUnmount,
  useCloseTransportsOnUnmount,
} from '@animo-id/react-native-ble-didcomm'
import type { Agent } from '@credo-ts/core'
import type React from 'react'
import { useState } from 'react'
import { Button, Text, View } from 'react-native'
import { Spacer } from '../Spacer'

type BleProverProps = {
  agent: Agent
  serviceUuid: string
}

export const BleProver: React.FC<BleProverProps> = ({ agent, serviceUuid }) => {
  const [hasSharedProof, setHasSharedProof] = useState(false)
  const { central } = useCentral()

  const onFailure = () => console.error('[CENTRAL]: failure')
  const onConnected = () => console.log('[CENTRAL]: connected')
  const onDisconnected = () => console.log('[CENTRAL]: disconnected')

  useCentralShutdownOnUnmount()
  useCloseTransportsOnUnmount(agent)

  const shareProof = () =>
    bleShareProof({
      onFailure,
      serviceUuid,
      central,
      agent,
      onConnected,
      onDisconnected,
    }).then(() => setHasSharedProof(true))

  return (
    <View>
      <Text>Ble Prover</Text>
      <Spacer />
      <Button title="Ready to share" onPress={shareProof} />
      <Spacer />
      <Text>Proof has{hasSharedProof ? ' ' : ' not '}been shared!</Text>
    </View>
  )
}
