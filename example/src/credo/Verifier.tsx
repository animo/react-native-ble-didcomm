import type { FunctionComponent } from 'react'
import { Text, View } from 'react-native'
import type { AppAgent } from './agent'

type VerifierProps = {
  agent: AppAgent
}

export const Verifier: FunctionComponent<VerifierProps> = ({ agent }) => {
  return (
    <View>
      <Text>Verifier</Text>
    </View>
  )
}
