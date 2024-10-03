# BLE Request Proof Function Documentation

## Overview

The `bleRequestProof` function is designed to facilitate a proof request over Bluetooth Low Energy (BLE).

## Function Signature

```typescript
export const bleRequestProof = async (options: BleRequestProofOptions) => Promise<string>
```

## Parameters

The function takes a single object parameter of type `BleRequestProofOptions` with the following properties:

- `agent: Agent` - An instance of the Agent class from the Credo framework.
- `peripheral: Peripheral` - A Peripheral object representing the BLE device.
    - This can be retrieved with the `usePeripheral` hook as shown in the example.
- `serviceUuid: string` - The UUID of the BLE service to use.
    - This UUID needs to be established out-of-band, i.e. by generating one and scanning a QR code.
- `presentationTemplate: PresentationTemplate` - An object containing the proof request details.
- `onFailure: () => Promise<void> | void` - A callback function to be called if the proof request fails.
- `onConnected?: () => Promise<void> | void` - An optional callback function to be called when the BLE connection is established.
- `onDisconnected?: () => Promise<void> | void` - An optional callback function to be called when the BLE connection is disconnected.

## Return Value

Proof record id

## Usage Example

```typescript
import { Agent } from '@credo-ts/core';
import { bleRequestProof, PresentationTemplate, usePeripheral } from '@animo-id/react-native-ble-didcomm';

const agent = new Agent(/* agent configuration */);
const peripheral = usePeripheral();

const presentationTemplate: PresentationTemplate = {
  id: 'template-id',
  name: 'Proof Request Template',
  requestMessage: {
    anoncreds: {
      name: 'anon-request',
      version: '2.0',
      requested_attributes: { nameGroup: { name: 'name' } },
      requested_predicates: {
        ageGroup: { name: 'age', p_value: 20, p_type: '>' },
      },
    },
  },
};

const serviceUuid = 'your-service-uuid';

try {
  const proofRecordId = await bleRequestProof({
    agent,
    peripheral,
    serviceUuid,
    presentationTemplate,
    onFailure: () => console.error('Proof request failed'),
    onConnected: () => console.log('BLE connected'),
    onDisconnected: () => console.log('BLE disconnected')
  });

  console.log(`Proof record created with ID: ${proofRecordId}`);
} catch (error) {
  console.error('Error in bleRequestProof:', error);
}
```

## Function Flow

1. Starts the BLE transport for the agent.
2. Sets up the indication, message and service UUID as characteristics
3. Sets up a disconnection notifier.
4. Sends the proof request message when connected.
5. Starts a message receiver for incoming messages.
6. Waits for the proof to be received and processes it.
7. Returns the proof record ID upon successful completion.

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
