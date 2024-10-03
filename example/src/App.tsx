import React, { type ReactElement, useState, useEffect } from 'react'
import { Button, Platform, StyleSheet, View } from 'react-native'

import { requestPermissions } from './RequestPermissions'
import { Spacer } from './Spacer'
import { CredoScreen } from './credo/CredoScreen'
import { RegularScreen } from './regular/Screen'

export const App = () => {
  const [flow, setFlow] = useState<'regular' | 'credo'>(undefined)

  let component: ReactElement

  useEffect(() => {
    if (Platform.OS === 'android') {
      void requestPermissions()
    }
  }, [])

  if (!flow) {
    component = (
      <>
        <Button title="credo flow" onPress={() => setFlow('credo')} />
        <Spacer />
        <Button title="regular flow" onPress={() => setFlow('regular')} />
      </>
    )
  }

  if (flow === 'regular') {
    component = <RegularScreen />
  }

  if (flow === 'credo') {
    component = <CredoScreen />
  }

  return (
    <View style={styles.container}>
      <Button title="reset" onPress={() => setFlow(undefined)} />
      <Spacer />
      {component}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
