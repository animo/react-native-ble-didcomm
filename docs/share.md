# BLE Share Proof Function Documentation

## Overview

The `bleShareProof` function is designed to facilitate a response to a proof request over Bluetooth Low Energy (BLE).

## Function Signature

```typescript
export const bleShareProof = async (options: BleShareProofOptions): Promise<string>
```

## Parameters

The function takes a single object parameter of type `BleShareProofOptions` with the following properties:

- `agent: Agent` - An instance of the Agent class from the Credo framework.
- `central: Central` - A Central object representing the BLE central device.
    - This can be retrieved with the `useCentral` hook as shown in the example.
- `serviceUuid: string` - The UUID of the BLE service to use.
    - This UUID needs to be established out-of-band, i.e. by generating one and scanning a QR code.
- `onFailure: () => Promise<void> | void` - A callback function to be called if the proof sharing fails.
- `onConnected?: () => Promise<void> | void` - An optional callback function to be called when the BLE connection is established.
- `onDisconnected?: () => Promise<void> | void` - An optional callback function to be called when the BLE connection is disconnected.

## Return Value

The function returns a Promise that resolves to `void` when the proof sharing process is complete.

## Usage Example

```typescript
import { Agent } from '@credo-ts/core';
import { bleShareProof, useCentral } from '@animo-id/react-native-ble-didcomm';

const agent = new Agent(/* agent configuration */);
const central = useCentral();

const serviceUuid = 'your-service-uuid';

try {
  await bleShareProof({
    agent,
    central,
    serviceUuid,
    onFailure: () => console.error('Proof sharing failed'),
    onConnected: () => console.log('BLE connected'),
    onDisconnected: () => console.log('BLE disconnected')
  });

  console.log('Proof sharing completed successfully');
} catch (error) {
  console.error('Error in bleShareProof:', error);
}
```

## Function Flow

1. Starts the BLE transport for the agent (both inbound and outbound).
2. Initializes the central device and starts scanning for peripherals.
3. Sets up a disconnection notifier.
4. Discovers and connects to a peripheral device.
5. Notifies when connected.
6. Shares the proof by:
   a. Receiving an out-of-band invitation.
   b. Automatically responding to the proof request.
7. Handles the acknowledgment of the shared proof.

## Error Handling

If an error occurs during the execution of the function, it will:

1. Log the error using the agent's logger.
2. Call the `onFailure` callback.
3. Throw the error for the caller to handle.

## Peer Dependencies

- `@credo-ts/core`
- `@credo-ts/anoncreds`
- `react`
- `react-native`

## Notes

- The function uses credo-ts for presentation exchange.
- It's designed to work with Bluetooth Low Energy, so make sure your environment supports BLE operations.
- The function handles the entire flow of requesting and receiving a proof over BLE, including connection management and message exchange.
