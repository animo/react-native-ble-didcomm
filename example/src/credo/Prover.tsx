import { useAgent } from '@credo-ts/react-hooks'
import { type FunctionComponent, type ReactElement, useState } from 'react'
import { Button } from 'react-native'
import { BleProver } from './BleProver'
import { Camera } from './Camera'

type ProverProps = {
  serviceUuid: string
}

export const Prover: FunctionComponent<ProverProps> = ({ serviceUuid }) => {
  const { agent } = useAgent()
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
