import React, { PropsWithChildren, useEffect, useMemo, useState } from 'react'
import { Button } from 'react-native'
import {
  Peripheral as BlePeripheral,
  DEFAULT_DIDCOMM_SERVICE_UUID,
  DEFAULT_DIDCOMM_MESSAGE_CHARACTERISTIC_UUID,
  DEFAULT_DIDCOMM_INDICATE_CHARACTERISTIC_UUID,
  PeripheralProvider,
  usePeripheralOnConnected,
  usePeripheralOnDisconnected,
  usePeripheralOnReceiveMessage,
  usePeripheralShutdownOnUnmount,
} from '@animo-id/react-native-ble-didcomm'
import { Spacer } from './App'

const msg = 'Hello from peripheral!'

export const Peripheral: React.FC<PropsWithChildren> = ({ children }) => {
  const peripeheral = useMemo(() => new BlePeripheral(), [])

  return <PeripheralProvider value={peripheral}>{children}</PeripheralProvider>
}

const PeripheralChildren = () => {
  usePeripheralShutdownOnUnmount()

  const [isConnected, setIsConnected] = useState(false)

  usePeripheralOnConnected((identifier: string) => {
    console.log(`[PERIPHERAL]: Connected to ${identifier}`)
    setIsConnected(true)
  })

  usePeripheralOnDisconnected((identifier: string) => {
    console.log(`[PERIPHERAL]: Connected to ${identifier}`)
    setIsConnected(true)
  })

  usePeripheralOnReceiveMessage((message: string) => {
    console.log(`[PERIPHERAL]: Received message: ${message}`)
  })

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
