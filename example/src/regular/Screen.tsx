import { isBleEnabled } from '@animo-id/react-native-ble-didcomm'
import * as React from 'react'
import { useState } from 'react'
import { Alert, Button, Text } from 'react-native'
import { Spacer } from '../Spacer'
import { Central } from './Central'
import { Peripheral } from './Peripheral'

export const RegularScreen = () => {
  const [isCentral, setIsCentral] = useState<boolean>(false)
  const [isPeripheral, setIsPeripheral] = useState<boolean>(false)

  const asCentral = () => setIsCentral(true)

  const asPeripheral = () => setIsPeripheral(true)

  return (
    <>
      <Text>Bluetooth demo screen. role: {isCentral ? 'central' : isPeripheral ? 'peripheral' : 'none'}</Text>
      <Spacer />
      <Button
        title="is ble enabled"
        onPress={() => isBleEnabled().then((isEnabled) => Alert.alert(isEnabled ? 'yes' : 'no'))}
      />
      <Spacer />
      {(isCentral || isPeripheral) && (
        <>
          <Button
            title="Back"
            onPress={() => {
              setIsCentral(false)
              setIsPeripheral(false)
            }}
          />
          <Spacer />
        </>
      )}
      {!isCentral && !isPeripheral && (
        <>
          <Button title="Central" onPress={asCentral} />
          <Spacer />
          <Button title="Peripheral" onPress={asPeripheral} />
        </>
      )}
      {isCentral && <Central />}
      {isPeripheral && <Peripheral />}
    </>
  )
}
