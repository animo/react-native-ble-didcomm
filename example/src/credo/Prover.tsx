import { type FunctionComponent, useEffect, useState } from 'react'
import { Button, Text, View } from 'react-native'
import { Camera } from './Camera'
import type { AppAgent } from './agent'

type ProverProps = {
  agent: AppAgent
}

export const Prover: FunctionComponent<ProverProps> = ({ agent }) => {
  const [showCamera, setShowCamera] = useState(false)
  const [credentialCount, setCredentialCount] = useState(0)

  useEffect(() => {
    agent.credentials.getAll().then((a) => setCredentialCount(a.length))
  }, [agent.credentials.getAll])

  const onQrScanned = async (data: string) => {
    console.log('scanned!')
    setShowCamera(false)
    await agent.oob.receiveInvitationFromUrl(data)
  }

  if (showCamera) {
    return <Camera onQrScanned={onQrScanned} />
  }

  return (
    <View>
      <Button title="scan QR code" onPress={() => setShowCamera(true)} />
      <Text>Prover with {credentialCount} credentials</Text>
    </View>
  )
}
