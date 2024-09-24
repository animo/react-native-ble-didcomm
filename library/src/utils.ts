import { Buffer } from 'buffer'

export const stringToBytes = (s: string) => Uint8Array.from(Buffer.from(s))

export const bytesToString = (b: Uint8Array) => Buffer.from(b).toString('utf-8')
