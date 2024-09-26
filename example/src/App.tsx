import React, { type ReactElement, useState } from 'react'
import { Button, StyleSheet, View } from 'react-native'

import { Spacer } from './Spacer'
import { RegularScreen } from './regular/Screen'

export const App = () => {
  const [flow, setFlow] = useState<'regular' | 'credo'>(undefined)

  let component: ReactElement

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
    component = <RegularScreen />
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
