import { Hash256, PedersenHash, StarkKey } from '@explorer/types'

export function formatHash(hash: PedersenHash | StarkKey | Hash256 | string) {
  const stringifiedHash = hash.toString()
  return stringifiedHash.startsWith('0x')
    ? stringifiedHash
    : '0x' + stringifiedHash
}
