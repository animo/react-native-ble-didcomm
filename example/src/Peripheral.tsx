import React, { useEffect, useState } from 'react'
import { Button } from 'react-native'
import {
  Peripheral as BlePeripheral,
  DEFAULT_DIDCOMM_SERVICE_UUID,
  DEFAULT_DIDCOMM_MESSAGE_CHARACTERISTIC_UUID,
  DEFAULT_DIDCOMM_INDICATE_CHARACTERISTIC_UUID,
} from '@animo-id/react-native-ble-didcomm'
import { Spacer } from './App'

const msg = 'Hello from peripheral!'

export const Peripheral = () => {
  const peripheral = new BlePeripheral()
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const onConnectedCentralListener = peripheral.registerOnConnectedListener(
      ({ identifier }: { identifier: string }) => {
        console.log(`[PERIPHERAL]: Connected to ${identifier}`)
        setIsConnected(true)
      }
    )

    const onDisconnectedCentralListener =
      peripheral.registerOnDisconnectedListener(
        ({ identifier }: { identifier: string }) => {
          console.log(`[PERIPHERAL]: Disconnected from ${identifier}`)
          setIsConnected(false)
        }
      )

    const onReceivedWriteWithoutResponseListener =
      peripheral.registerMessageListener(({ message }: { message: string }) =>
        console.log(`[PERIPHERAL]: Received message: ${message}`)
      )

    return () => {
      void shutdown()
      onConnectedCentralListener.remove()
      onReceivedWriteWithoutResponseListener.remove()
      onDisconnectedCentralListener.remove()
    }
  }, [])

  const start = peripheral.start

  const shutdown = async () => {
    await peripheral.shutdown()
    setIsConnected(false)
  }

  const setServices = async () => {
    await peripheral.setService({
      serviceUUID: DEFAULT_DIDCOMM_SERVICE_UUID,
      messagingUUID: DEFAULT_DIDCOMM_MESSAGE_CHARACTERISTIC_UUID,
      indicationUUID: DEFAULT_DIDCOMM_INDICATE_CHARACTERISTIC_UUID,
    })
  }

  const advertise = peripheral.advertise

  const sendMessage = () => peripheral.sendMessage(msg)

  return (
    <>
      <Button title="start" onPress={start} />
      <Spacer />
      <Button title="shutdown" onPress={shutdown} />
      <Spacer />
      <Button title="set services" onPress={setServices} />
      <Spacer />
      <Button title="advertise" onPress={advertise} />
      <Spacer />
      {isConnected && <Button title="notify" onPress={sendMessage} />}
    </>
  )
}
