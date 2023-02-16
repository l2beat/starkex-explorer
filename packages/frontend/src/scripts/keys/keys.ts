// Follows the same logic as https://github.com/dydxprotocol/starkex-lib

import { keccak256 } from '@ethersproject/keccak256'
import { curves, ec as EllipticCurve } from 'elliptic'
import { sha256 } from 'hash.js'

export interface SimpleKeyPair {
  publicKey: string
  publicKeyYCoordinate: string
  privateKey: string
}

export function keyPairFromData(hexData: string): SimpleKeyPair {
  const hashedData = keccak256(hexData)
  const privateKey = BigInt(hashedData) / 2n ** 5n
  const normalized = normalizeHex32(privateKey.toString(16))
  const keyPair = starkEc.keyFromPrivate(normalized)
  return toSimpleKeyPair(keyPair)
}

const starkEc = new EllipticCurve(
  new curves.PresetCurve({
    type: 'short',
    prime: null,
    p: '800000000000011000000000000000000000000000000000000000000000001',
    a: '000000000000000000000000000000000000000000000000000000000000001',
    b: '6f21413efbe40de150e596d72f7a8c5609ad26c15c915c1f4cdfcb99cee9e89',
    n: '800000000000010ffffffffffffffffb781126dcae7b2321e66a241adc64d2f',
    hash: sha256,
    gRed: false,
    g: [
      '1ef15c18599971b7beced415a40f0c7deacfd9b0d1819e03d723d8bc943cfca',
      '05668060aa49730b7be4801df46ec62de53ecd11abe43a32873000c36e8dc1f',
    ],
  })
)

function toSimpleKeyPair(keyPair: EllipticCurve.KeyPair): SimpleKeyPair {
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
