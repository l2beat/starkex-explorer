import { PedersenHash } from '@explorer/types'
import { pedersen_from_hex } from 'pedersen-fast'

export function pedersenSync(a: PedersenHash, b: PedersenHash) {
  return PedersenHash(pedersen_from_hex(a.toString(), b.toString()))
}
