/* eslint-disable react-native/no-inline-styles */
import * as React from "react"
import {
  StyleSheet,
  View,
  Text,
  Button,
  PermissionsAndroid,
  Platform,
  NativeEventEmitter,
  NativeModules,
} from "react-native"
import {
  startCentral,
  startPeripheral,
  advertise,
  scan,
  connect,
  write,
  notify,
  DIDCOMM_SERVICE_UUID,
  MESSAGE_CHARACTERISTIC_UUID,
} from "react-native-ble-didcomm-sdk"

const bleDidcommSdkEmitter = new NativeEventEmitter(NativeModules.BleDidcommSdk)

const Spacer = () => <View style={{ height: 20, width: 20 }} />

const msg =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque ipsum elit, tincidunt a eleifend a, suscipit vel ipsum. Mauris non nunc venenatis, egestas dolor id, venenatis nunc. Nulla elementum sed tortor id molestie. Praesent non erat nec urna blandit ullamcorper in ut quam. Vestibulum non ante blandit, eleifend odio tristique, ornare nisl. Aenean feugiat hendrerit nulla, at facilisis tellus sagittis ut. Praesent at sodales magna. In a tincidunt elit. Donec quis sodales ex, vitae egestas nisi. Cras ut diam mattis, rhoncus lorem sagittis, sodales orci. Quisque fermentum tellus nec convallis rhoncus. Nunc congue dictum consectetur. Curabitur ullamcorper sagittis tempus. Quisque in ultricies enim. Pellentesque fringilla mollis libero, at tristique massa sodales in. Praesent pretium erat lectus, ut rutrum purus convallis sed. Aliquam eget metus sed metus elementum condimentum et sit amet mauris. Nam dictum ante sit amet rutrum ultricies. Praesent in lacinia ipsum. Praesent lectus. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus pulvinar arcu ut lectus interdum sagittis. Maecenas varius augue vel dui laoreet, a laoreet dolor porta. Praesent nulla leo, varius nec dapibus sit amet, sagittis vehicula massa. Etiam non lacus eget mi tincidunt facilisis eu vel felis. Duis elit sapien, fringilla at mattis a, sodales a nisl. Aenean id eros molestie, tincidunt dolor at, tincidunt arcu. Maecenas nec justo quis massa luctus ultrices sit amet ut risus. Donec erat lacus, suscipit ac sodales quis, imperdiet sed nunc. Phasellus ac dui vitae enim molestie pharetra. Suspendisse iaculis elit mauris, id sagittis velit suscipit eget. Donec commodo erat volutpat quam mollis, vitae congue magna faucibus. Maecenas interdum tellus blandit bibendum posuere. Duis condimentum enim orci, ac ultricies orci commodo quis. Ut pellentesque congue facilisis. In ipsum erat, molestie a metus nec, condimentum lobortis quam. Suspendisse potenti. Nullam massa ex, tincidunt quis enim eu, dignissim cursus sem. Etiam in elit sed leo condimentum aliquam. Donec hendrerit velit nec magna convallis mattis. Cras venenatis elit in elit euismod, eget pharetra ante pretium. Etiam pulvinar sapien eget aliquam facilisis. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Nam lacus elit, fermentum sit amet dui nec, rhoncus pulvinar magna. Aliquam mollis congue orci non dapibus. Nullam eget laoreet lectus. Suspendisse eget lacinia augue. Pellentesque quis dolor lacus. Aenean iaculis dictum finibus. Nam non orci eget arcu cursus vehicula sit amet at metus. Pellentesque a dignissim risus. Pellentesque vel massa interdum, condimentum odio sed, tincidunt diam. Maecenas et rutrum felis, et dictum massa. Vestibulum eu pellentesque enim, nec aliquet ex. Duis et viverra enim. Integer mollis eros quis tellus feugiat, ac fermentum nisi cursus. Cras sollicitudin, massa non mattis dictum, sapien sapien lobortis ipsum, quis feugiat orci ligula id augue. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Proin vestibulum odio in tellus feugiat cursus in at augue. Vivamus bibendum eros a leo egestas blandit. Nunc dignissim mi vel mauris blandit vestibulum. Sed sed purus nibh. Duis urna nulla, placerat eget nunc at, venenatis porta lectus. Aliquam tristique pharetra tortor, ac placerat metus suscipit nec. Maecenas non dui sit amet eros iaculis convallis. Pellentesque vehicula elementum nisi in venenatis. Duis vulputate diam et congue ullamcorper. Nam vitae orci at dui vestibulum auctor elementum non dolor. Nulla facilisi. Pellentesque malesuada sapien quis enim mollis congue. Sed dui nisi, interdum in scelerisque vel, pulvinar vitae quam. Sed facilisis nisl tempor finibus egestas. Suspendisse at quam neque. Mauris eu nisl a eros placerat volutpat. Donec rutrum varius tellus, in gravida nisi eleifend ut. Ut aliquam lorem orci, nec posuere orci mattis ut. In non tellus scelerisque, cursus augue vel, aliquam lacus. Curabitur ut odio non lorem consequat hendrerit in vel metus. Sed nec iaculis sapien. Nullam accumsan massa posuere eros feugiat, vitae vestibulum est tincidunt. Curabitur nec porta tortor. Proin vel porttitor libero, ac egestas tellus. Ut euismod vehicula est ultricies placerat. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Integer scelerisque, risus at rhoncus blandit, risus ex tristique nisi, vitae laoreet elit risus ac dolor. Sed eu augue auctor, tincidunt mauris et, euismod sapien. Pellentesque condimentum posuere sagittis. Proin dictum urna in eleifend imperdiet. Nam fermentum est sed enim lacinia hendrerit. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Pellentesque pellentesque nunc turpis, nec dignissim nisi dictum id."

const requestPermissions = async () => {
  await PermissionsAndroid.requestMultiple([
    "android.permission.ACCESS_FINE_LOCATION",
    "android.permission.BLUETOOTH_CONNECT",
    "android.permission.BLUETOOTH_SCAN",
    "android.permission.BLUETOOTH_ADVERTISE",
    "android.permission.ACCESS_COARSE_LOCATION",
  ])
}

export default function App() {
  const [isCentral, setIsCentral] = React.useState(false)
  const [isPeripheral, setIsPeripheral] = React.useState(false)
  const [peripheralId, setPeripheralId] = React.useState<string>()
  const [connected, setConnected] = React.useState(false)

  React.useEffect(() => {
    const onDiscoverPeripheralListener = bleDidcommSdkEmitter.addListener(
      "onDiscoverPeripheral",
      ({
        peripheralId: pId,
        name,
      }: {
        peripheralId: string
        name?: string
      }) => {
        console.log(`Discovered: ${pId} ${name ? "with name:" + name : ""}`)
        setPeripheralId(pId)
      }
    )

    const onConnectedPeripheralListener = bleDidcommSdkEmitter.addListener(
      "onConnectedPeripheral",
      ({ peripheralId: pId }: { peripheralId: string }) => {
        console.log(`Connected to: ${pId}`)
        setConnected(true)
      }
    )

    const onReceivedNotificationListener = bleDidcommSdkEmitter.addListener(
      "onReceivedNotification",
      console.log
    )

    const onReceivedWriteWithoutResponseListener = bleDidcommSdkEmitter.addListener(
      "onReceivedWriteWithoutResponse",
      console.log
    )

    return () => {
      onDiscoverPeripheralListener.remove()
      onConnectedPeripheralListener.remove()
      onReceivedNotificationListener.remove()
      onReceivedWriteWithoutResponseListener.remove()
    }
  }, [])

  return (
    <View style={styles.container}>
      <Text>Bluetooth demo screen</Text>
      <Spacer />
      {Platform.OS === "android" && (
        <>
          <Button
            title="requestPermissions"
            onPress={async () => {
              await requestPermissions()
            }}
          />
          <Spacer />
        </>
      )}
      <Button
        title="start: central"
        onPress={async () => {
          await startCentral()
          setIsCentral(true)
        }}
      />
      <Button
        title="start: peripheral"
        onPress={async () => {
          await startPeripheral()
          setIsPeripheral(true)
        }}
      />
      {isCentral && (
        <>
          <Button title="scan" onPress={scan} />
          {peripheralId && (
            <Button title="connect" onPress={() => connect(peripheralId)} />
          )}
          {connected && <Button title="write" onPress={() => write(msg)} />}
        </>
      )}
      {isPeripheral && (
        <>
          <Button title="advertise" onPress={advertise} />
          <Button title="notify" onPress={() => notify(msg)} />
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
})
