<p align="center">
  <picture>
   <source media="(prefers-color-scheme: light)" srcset="https://res.cloudinary.com/animo-solutions/image/upload/v1656578320/animo-logo-light-no-text_ok9auy.svg">
   <source media="(prefers-color-scheme: dark)" srcset="https://res.cloudinary.com/animo-solutions/image/upload/v1656578320/animo-logo-dark-no-text_fqqdq9.svg">
   <img alt="Animo Logo" height="250px" />
  </picture>
</p>

<h1 align="center" ><b>React Native Ble DIDComm SDK</b></h1>

<h4 align="center">Powered by &nbsp; 
  <picture>
    <source media="(prefers-color-scheme: light)" srcset="https://res.cloudinary.com/animo-solutions/image/upload/v1656579715/animo-logo-light-text_cma2yo.svg">
    <source media="(prefers-color-scheme: dark)" srcset="https://res.cloudinary.com/animo-solutions/image/upload/v1656579715/animo-logo-dark-text_uccvqa.svg">
    <img alt="Animo Logo" height="12px" />
  </picture>
</h4><br>

<!-- TODO: Add relevant badges, like CI/CD, license, codecov, etc. -->

<p align="center">
  <a href="https://typescriptlang.org">
    <img src="https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg" />
  </a>
  <a href="https://yarnpkg.com">
    <img src="https://img.shields.io/badge/yarn-workspaces-2188b6" />
  </a>
  <a href="https://opensource.org/licenses/Apache-2.0">
    <img src="https://img.shields.io/badge/License-Apache_2.0-yellowgreen.svg" />
  </a>
</p>

<p align="center">
  <a href="#getting-started">Getting started</a> 
  &nbsp;|&nbsp;
  <a href="#usage">Usage</a> 
  &nbsp;|&nbsp;
  <a href="#development">Development</a> 
  &nbsp;|&nbsp;
  <a href="#contributing">Contributing</a> 
  &nbsp;|&nbsp;
  <a href="#contributing">License</a> 
</p>

---

## Getting Started

First, you need to add the dependency to your project:

> TODO: this is not released yet

```sh
yarn add react-native-ble-didcomm-sdk
```

### Android

add the following to your `android/app/src/main/AndroidManifest.xml`

```diff
+   <uses-permission android:name="android.permission.INTERNET" />
+   <uses-permission android:name="android.permission.BLUETOOTH"
+                    android:maxSdkVersion="30" />
+   <uses-permission android:name="android.permission.BLUETOOTH_ADMIN"
+                    android:maxSdkVersion="30" />
+   <uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
+   <uses-permission android:name="android.permission.BLUETOOTH_ADVERTISE" />
+   <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
+   <uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
+   <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
+   <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

### iOS

Run `pod install` in the `ios/` directory

## Usage

An example can be found here: [example](./example/src/App.tsx)

### Make sure the correct permissions are requested on android:

```typescript
await PermissionsAndroid.requestMultiple([
  "android.permission.ACCESS_FINE_LOCATION",
  "android.permission.BLUETOOTH_CONNECT",
  "android.permission.BLUETOOTH_SCAN",
  "android.permission.BLUETOOTH_ADVERTISE",
  "android.permission.ACCESS_COARSE_LOCATION",
])
```

### Setting up the listeners:

```typescript
React.useEffect(() => {
  const onDiscoverPeripheralListener = bleDidcommSdkEmitter.addListener(
    "onDiscoverPeripheral",
    console.log
  )

  const onConnectedPeripheralListener = bleDidcommSdkEmitter.addListener(
    "onConnectedPeripheral",
    console.log
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
```

### Start advertising (peripheral):

```typescript
import { startPeripheral, advertise } from "react-native-ble-didcomm-sdk"

await startPeripheral()
await advertise()
```

### Start scanning (central):

```typescript
import { startCentral, scan } from "react-native-ble-didcomm-sdk"

await startCentral()
await scan()
```

### Connect (central):

```typescript
import { connect } from "react-native-ble-didcomm-sdk"

// peripheralId can be retrieved from the `onDiscoverPeripheralListener`
// as shown above with the listeners

await connect(peripheralId)
```

### Send message (central):

```typescript
import { write } from "react-native-ble-didcomm-sdk"

await write("Hello World!")
```

### Send indication / message (peripheral):

```typescript
import { notify } from "react-native-ble-didcomm-sdk"

await notify("Hello World!")
```

## Development

When developing new features, you can use the application inside the `example/` folder.

To get started you can run the following commands from the root of the project:

```sh
yarn example

yarn example start

yarn example android

pod install --project-directory=example/ios
yarn example ios
```

## Contributing

Is there something you'd like to fix or add? Great, we love community
contributions! To get involved, please follow our [contribution
guidelines](./CONTRIBUTING.md).

## License

<!-- TODO: Add license like MIT or Apache 2.0 here -->
<!-- This project is licensed under the [Apache 2.0
License](https://opensource.org/licenses/Apache-2.0). -->
