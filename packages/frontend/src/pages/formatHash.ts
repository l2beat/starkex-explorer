import { PedersenHash } from '@explorer/types'

export function formatHash(hash: PedersenHash | string) {
  const stringifiedHash = hash.toString()
  return stringifiedHash.startsWith('0x')
    ? stringifiedHash
    : '0x' + stringifiedHash
}
