import React, { PropsWithChildren, useEffect, useMemo, useState } from 'react'
import { Button } from 'react-native'
import {
  Central as BleCentral,
  DEFAULT_DIDCOMM_SERVICE_UUID,
  DEFAULT_DIDCOMM_MESSAGE_CHARACTERISTIC_UUID,
  DEFAULT_DIDCOMM_INDICATE_CHARACTERISTIC_UUID,
  useCentral,
  useCentralOnDiscovered,
  useCentralOnConnected,
  useCentralOnDisconnected,
  useCentralOnReceivedMessage,
  useCentralShutdownOnUnmount,
} from '@animo-id/react-native-ble-didcomm'
import { Spacer } from './App'

const msg = 'Hello from Central!'

export const Central: React.FC<PropsWithChildren> = ({ children }) => {
  const central = useMemo(() => new BleCentral(), [])

  return <CentralProvider value={central}>{children}</CentralProvider>
}

const CentralChildren = () => {
  useCentralShutdownOnUnmount()

  const [peripheralId, setPeripheralId] = useState<string>()
  const [isConnected, setIsConnected] = useState<boolean>(false)

  const { central } = useCentral()

  useCentralOnDiscovered((identifier: string) => {
    console.log(`[CENTRAL]: Discovered: ${identifier}`)
    setPeripheralId(identifier)
  })

  useCentralOnConnected((identifier: string) => {
    console.log(`[CENTRAL]: Connected to: ${identifier}`)
    setIsConnected(true)
  })

  useCentralOnReceivedMessage((message: string) => {
    console.log(`[CENTRAL]: Received indication: ${message}`)
  })

  useCentralOnDisconnected((identifier: string) => {
    console.log(`[CENTRAL]: Disconnected from ${identifier}`)
  })

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

  const connect = () =>
    peripheralId
      ? central.connect(peripheralId)
      : console.error('Peripheral id is not defined')

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
