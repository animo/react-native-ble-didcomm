import { type FunctionComponent, type ReactElement, useState } from 'react'
import { Button } from 'react-native'
import { BleProver } from './BleProver'
import { Camera } from './Camera'
import type { AppAgent } from './agent'

type ProverProps = {
  agent: AppAgent
  serviceUuid: string
}

export const Prover: FunctionComponent<ProverProps> = ({ agent, serviceUuid }) => {
  const [showCamera, setShowCamera] = useState(false)
  const [bleFlowInProgress, setBleFlowInProgress] = useState(false)

  const onQrScanned = async (data: string) => {
    setShowCamera(false)
    await agent.oob.receiveInvitationFromUrl(data)
  }

  if (showCamera) {
    return <Camera onQrScanned={onQrScanned} />
  }

  let component: ReactElement

  if (bleFlowInProgress) {
    component = (
      <>
        <Button title="quit ble flow" onPress={() => setBleFlowInProgress(false)} />
        <BleProver agent={agent} serviceUuid={serviceUuid} />
      </>
    )
  }

  if (!bleFlowInProgress) {
    component = (
      <>
        <Button title="scan QR code" onPress={() => setShowCamera(true)} />
        <Button title="start ble flow" onPress={() => setBleFlowInProgress(true)} />
      </>
    )
  }

  return component
}
