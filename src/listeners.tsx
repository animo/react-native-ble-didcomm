/**
 * This function will call your callback when a new client is discovered after scanning
 */
// export const useDiscoverClients = (
//   callback: (peripheralId: string) => Promise<void> | void
// ) => {
//   useEffect(() => {
//     const listener = bleManagerEmitter.addListener(
//       "BleManagerDiscoverPeripheral",
//       async (peripheral: { id: string }) => {
//         await callback(peripheral.id)
//       }
//     )
//     return () => listener.remove()
//   }, [callback])
// }
// 
// /**
//  * This function will call your callback when a new message is received
//  */
// export const useReceivedMessageAsPeripheral = (
//   callback: (message: string) => Promise<void> | void
// ) => {
//   useEffect(() => {
//     const listener = bleManagerEmitter.addListener(
//       "BleManagerDidUpdateValueForCharacteristic",
//       async ({ value }: { value: Uint8Array }) => {
//         await callback(bytesToString(value))
//       }
//     )
//     return () => listener.remove()
//   }, [callback])
// }
// 
// /**
//  * This function will call your callback when a new connection is established
//  */
// export const useConnectedToClient = (
//   callback: (peripheralId: string) => Promise<void> | void
// ) => {
//   useEffect(() => {
//     const listener = bleManagerEmitter.addListener(
//       "BleManagerConnectPeripheral",
//       async ({ peripheral }: { peripheral: string }) => {
//         await callback(peripheral)
//       }
//     )
//     return () => listener.remove()
//   }, [callback])
// }
// 
// export const useBluetoothStatusChange = (
//   callback: (options: { enabled: boolean }) => Promise<void> | void
// ) => {
//   useEffect(() => {
//     const listener = bleAdvertiserEmitter.addListener(
//       "onBTStatusChange",
//       async (resp) => {
//         await callback(resp)
//       }
//     )
//     return () => listener.remove()
//   }, [callback])
// }
// 
// export const useReceivedMessageAsCentral = (
//   callback: (options: any) => Promise<void> | void
// ) => {
//   useEffect(() => {
//     const listener = bleDidcommSdkEmitter.addListener(
//       "BleOnNotifyReceived",
//       async (resp) => {
//         await callback(resp)
//       }
//     )
//     return () => listener.remove()
//   }, [callback])
// }
