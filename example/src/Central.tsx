import React, { useEffect, useState } from 'react'
import { Button } from 'react-native'
import {
  Central as BleCentral,
  DEFAULT_DIDCOMM_SERVICE_UUID,
  DEFAULT_DIDCOMM_MESSAGE_CHARACTERISTIC_UUID,
  DEFAULT_DIDCOMM_INDICATE_CHARACTERISTIC_UUID,
} from '@animo-id/react-native-ble-didcomm'
import { Spacer } from './App'

const msg = 'Hello from Central!'

export const Central = () => {
  const central = new BleCentral()
  const [isConnected, setIsConnected] = useState(false)
  const [peripheralId, setPeripheralId] = useState<string>()

  useEffect(() => {
    const onDiscoverPeripheralListener = central.registerOnDiscoveredListener(
      ({ identifier }: { identifier: string }) => {
        console.log(`[CENTRAL]: Discovered: ${identifier}`)
        setPeripheralId(identifier)
      }
    )

    const onConnectedPeripheralListener = central.registerOnConnectedListener(
      ({ identifier }: { identifier: string }) => {
        console.log(`[CENTRAL]: Connected to: ${identifier}`)
        setIsConnected(true)
      }
    )

    const onDisconnectedPeripheralListener =
      central.registerOnDisconnectedListener(
        ({ identifier }: { identifier: string }) =>
          console.log(`[CENTRAL]: Disconnected from ${identifier}`)
      )

    const onReceivedNotificationListener = central.registerMessageListener(
      ({ message }: { message: string }) =>
        console.log(`[CENTRAL]: Received indication: ${message}`)
    )

    return () => {
      void shutdown()
      onDiscoverPeripheralListener.remove()
      onConnectedPeripheralListener.remove()
      onReceivedNotificationListener.remove()
      onDisconnectedPeripheralListener.remove()
    }
  }, [])

  const start = central.start

  const shutdown = async () => {
    await central.shutdown()
    setIsConnected(false)
    setPeripheralId(undefined)
  }

  const setServices = async () => {
    await central.setService({
      serviceUUID: DEFAULT_DIDCOMM_SERVICE_UUID,
      messagingUUID: DEFAULT_DIDCOMM_MESSAGE_CHARACTERISTIC_UUID,
      indicationUUID: DEFAULT_DIDCOMM_INDICATE_CHARACTERISTIC_UUID,
    })
  }

  const scan = central.scan

  const connect = () => central.connect(peripheralId)

  const write = () => central.sendMessage(msg)

  return (
    <>
      <Button title="start" onPress={start} />
      <Spacer />
      <Button title="shutdown" onPress={shutdown} />
      <Spacer />
      <Button title="set services" onPress={setServices} />
      <Spacer />
      <Button title="scan" onPress={scan} />
      <Spacer />
      {peripheralId && <Button title="connect" onPress={connect} />}
      <Spacer />
      {isConnected && <Button title="write" onPress={write} />}
    </>
  )
}
