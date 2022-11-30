import { Button, NativeEventEmitter, NativeModules } from 'react-native'
import {
  Peripheral,
  DEFAULT_DIDCOMM_SERVICE_UUID,
  DEFAULT_DIDCOMM_MESSAGE_CHARACTERISTIC_UUID,
  DEFAULT_DIDCOMM_INDICATE_CHARACTERISTIC_UUID,
} from '@animo-id/react-native-ble-didcomm'
import React from 'react'
import { presentationMsg } from './presentationMsg'

const bleDidcommEmitter = new NativeEventEmitter(NativeModules.BleDidcomm)

const peripheral = new Peripheral()

export const PeripheralComponent = () => {
  React.useEffect(() => {
    const onReceivedWriteWithoutResponseListener =
      bleDidcommEmitter.addListener(
        'onReceivedWriteWithoutResponse',
        console.log
      )
    return () => onReceivedWriteWithoutResponseListener.remove()
  }, [])

  React.useEffect(() => {
    peripheral.setIds({
      serviceId: DEFAULT_DIDCOMM_SERVICE_UUID,
      messagingId: DEFAULT_DIDCOMM_MESSAGE_CHARACTERISTIC_UUID,
      indicationId: DEFAULT_DIDCOMM_INDICATE_CHARACTERISTIC_UUID,
    })
    void peripheral.start()
  }, [])

  return (
    <>
      <Button
        title="advertise"
        onPress={async () => {
          await peripheral.advertise()
        }}
      />
      <Button
        title="notify"
        onPress={async () => {
          await peripheral.sendMessage(JSON.stringify(presentationMsg))
        }}
      />
    </>
  )
}
