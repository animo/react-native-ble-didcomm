import type { FunctionComponent } from 'react'
import { Text, View } from 'react-native'
import type { AppAgent } from './agent'

type IssuerProps = {
  agent: AppAgent
}

export const Issuer: FunctionComponent<IssuerProps> = ({ agent }) => {
  return (
    <View>
      <Text>Issuer</Text>
    </View>
  )
}
