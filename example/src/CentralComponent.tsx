import React from 'react'
import { Button, NativeEventEmitter, NativeModules } from 'react-native'

import {
  Central,
  DEFAULT_DIDCOMM_SERVICE_UUID,
  DEFAULT_DIDCOMM_MESSAGE_CHARACTERISTIC_UUID,
  DEFAULT_DIDCOMM_INDICATE_CHARACTERISTIC_UUID,
} from '@animo-id/react-native-ble-didcomm'
import { presentationMsg } from './presentationMsg'

const bleDidcommEmitter = new NativeEventEmitter(NativeModules.BleDidcomm)

const central = new Central()

export const CentralComponent: React.FC = () => {
  const [peripheralId, setPeripheralId] = React.useState<string>()
  const [connected, setConnected] = React.useState(false)

  React.useEffect(() => {
    const onDiscoverPeripheralListener = bleDidcommEmitter.addListener(
      'onDiscoverPeripheral',
      ({
        peripheralId: pId,
        name,
      }: {
        peripheralId: string
        name?: string
      }) => {
        console.log(`Discovered: ${pId} ${name ? 'with name:' + name : ''}`)
        setPeripheralId(pId)
      }
    )

    const onConnectedPeripheralListener = bleDidcommEmitter.addListener(
      'onConnectedPeripheral',
      ({ peripheralId: pId }: { peripheralId: string }) => {
        console.log(`Connected to: ${pId}`)
        setConnected(true)
      }
    )

    const onReceivedNotificationListener = bleDidcommEmitter.addListener(
      'onReceivedNotification',
      console.log
    )

    return () => {
      onDiscoverPeripheralListener.remove()
      onConnectedPeripheralListener.remove()
      onReceivedNotificationListener.remove()
    }
  }, [])

  React.useEffect(() => {
    central.setIds({
      serviceId: DEFAULT_DIDCOMM_SERVICE_UUID,
      messagingId: DEFAULT_DIDCOMM_MESSAGE_CHARACTERISTIC_UUID,
      indicationId: DEFAULT_DIDCOMM_INDICATE_CHARACTERISTIC_UUID,
    })
    void central.start()
  }, [])

  return (
    <>
      <Button
        title="scan"
        onPress={async () => {
          await central.scan()
        }}
      />
      {peripheralId && (
        <Button
          title="connect"
          onPress={async () => {
            await central.connect(peripheralId)
          }}
        />
      )}
      {connected && (
        <Button
          title="write"
          onPress={async () => {
            await central.sendMessage(JSON.stringify(presentationMsg))
          }}
        />
      )}
    </>
  )
}
