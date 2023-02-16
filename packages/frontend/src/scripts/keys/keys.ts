import { keccak256 } from '@ethersproject/keccak256'
import { ec as EllipticCurve } from 'elliptic'

import { EC_ORDER_INT, starkEc } from './curve'

export interface StarkKeyPair {
  publicKey: string
  publicKeyYCoordinate: string
  privateKey: string
}

// Follows the same logic as https://github.com/dydxprotocol/starkex-lib
export function starkKeyPairFromData(hexData: string): StarkKeyPair {
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

function normalizeHex32(hex: string): string {
  return stripHexPrefix(hex).toLowerCase().padStart(64, '0')
}

function stripHexPrefix(hex: string): string {
  return hex.startsWith('0x') ? hex.slice(2) : hex
}

export function signStarkMessage(pair: StarkKeyPair, hexMessage: string) {
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
