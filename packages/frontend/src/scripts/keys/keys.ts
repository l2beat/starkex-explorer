import { keccak256 } from '@ethersproject/keccak256'
import BN from 'bn.js'
import { Buffer } from 'buffer'
import { ec as EllipticCurve } from 'elliptic'
import { sha256 } from 'hash.js'
import { z } from 'zod'

import { EC_ORDER_INT, starkEc } from './curve'

export interface StarkKeyPair {
  publicKey: string
  publicKeyYCoordinate: string
  privateKey: string
}

export type Registration = z.infer<typeof Registration>
export const Registration = z.object({
  r: z.string(),
  s: z.string(),
  y: z.string(),
  rsy: z.string(),
})

// Follows the same logic as https://github.com/dydxprotocol/starkex-lib
export function getDydxStarkExKeyPairFromData(hexData: string): StarkKeyPair {
  const hashedData = keccak256(hexData)
  const privateKey = BigInt(hashedData) / 2n ** 5n
  const normalized = normalizeHex32(privateKey.toString(16))

  const keyPair = starkEc.keyFromPrivate(normalized)
  return toSimpleKeyPair(keyPair)
}

function toSimpleKeyPair(keyPair: EllipticCurve.KeyPair): StarkKeyPair {
  const privateKey = keyPair.getPrivate()
  const publicKey = keyPair.getPublic()
  const [x, y] = [publicKey.getX(), publicKey.getY()]
  return {
    publicKey: normalizeHex32(x.toString(16)),
    publicKeyYCoordinate: normalizeHex32(y.toString(16)),
    privateKey: normalizeHex32(privateKey.toString(16)),
  }
}

export function signStarkMessage(
  pair: StarkKeyPair,
  hexMessage: string
): Registration {
  const keyPair = starkEc.keyFromPrivate(pair.privateKey)

  const hashed = keccak256(hexMessage)
  const onCurve = BigInt(hashed) % EC_ORDER_INT

  const { r, s } = keyPair.sign(adjustHashLength(onCurve.toString(16)))
  const rHex = r.toString(16).padStart(64, '0')
  const sHex = s.toString(16).padStart(64, '0')
  const yHex = pair.publicKeyYCoordinate.padStart(64, '0')

  return {
    r: '0x' + rHex,
    s: '0x' + sHex,
    y: '0x' + yHex,
    rsy: '0x' + rHex + sHex + yHex,
  }
}

// From: https://github.com/starkware-libs/starkware-crypto-utils/blob/d3a1e655105afd66ebc07f88a179a3042407cc7b/src/js/signature.js#L500
function adjustHashLength(msgHash: string) {
  // strip leading zeroes
  msgHash = BigInt('0x' + msgHash).toString(16)
  if (msgHash.length <= 62) {
    return msgHash
  }
  if (msgHash.length !== 63) {
    throw new Error('Invalid msgHash length')
  }
  return msgHash + '0'
}

// Myria's implementation
export function getMyriaStarkExKeyPairFromData(signature: string) {
  const sig = stripHexPrefix(signature).slice(0, 64)
  const privateKey = getStarkExPrivateKeyFromSignature(sig)
  const keyPair = starkEc.keyFromPrivate(privateKey, 'hex')

  return toSimpleKeyPair(keyPair)
}

function getStarkExPrivateKeyFromSignature(signature: string): string {
  if (!starkEc.n) {
    throw new Error('starkEc.n is not defined')
  }
  const rMax = new BN(
    '10000000000000000000000000000000000000000000000000000000000000000',
    16
  )
  const rModOrder = rMax.sub(rMax.mod(starkEc.n))
  let attemptCount = 0
  let hashValue = calculateHashValue(signature, attemptCount)
  while (!hashValue.lt(rModOrder)) {
    attemptCount++
    hashValue = calculateHashValue(
      Buffer.from(signature, 'hex').toString('hex'),
      attemptCount
    )
  }
  return hashValue.umod(starkEc.n).toString('hex')
}

function calculateHashValue(hexString: string, number: number): BN {
  const bytes = Buffer.from(
    stripHexPrefix(hexString) + sanitizeBytes(numberToHex(number), 2),
    'hex'
  )
  const hash = sha256().update(bytes).digest('hex')
  return new BN(hash, 16)
}

// End of Myria's implementation

function normalizeHex32(hex: string): string {
  return stripHexPrefix(hex).toLowerCase().padStart(64, '0')
}

function stripHexPrefix(hex: string): string {
  return hex.startsWith('0x') ? hex.slice(2) : hex
}

function sanitizeBytes(bytes: string, expectedLength: number): string {
  const lengthDiff = expectedLength - bytes.length
  if (lengthDiff > 0) {
    bytes = '0'.repeat(lengthDiff) + bytes
  }
  return bytes
}

function numberToHex(n: number): string {
  return n.toString(16)
}
