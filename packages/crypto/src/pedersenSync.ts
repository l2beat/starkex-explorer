import { PedersenHash } from '@explorer/types'
import BN from 'bn.js'
import { pedersen } from 'pedersen-fast'

export function pedersenSync(a: PedersenHash, b: PedersenHash) {
  // @todo avoid doing HEX->DEC conversion in JS
  const aBN = new BN(a.toString(), 16)
  const bBN = new BN(b.toString(), 16)

  return PedersenHash(pedersen(aBN.toString(), bBN.toString()))
}
