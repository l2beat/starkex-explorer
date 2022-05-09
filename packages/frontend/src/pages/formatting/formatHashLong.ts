import { Hash256, PedersenHash, StarkKey } from '@explorer/types'

export function formatHashLong(
  hash: PedersenHash | StarkKey | Hash256 | string
) {
  const digits = hash.startsWith('0x') ? hash.slice(2) : hash.toString()
  return '0x' + digits.toUpperCase()
}
