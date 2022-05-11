import { Hash256, PedersenHash, StarkKey } from '@explorer/types'

export function formatHashLong(
  hash: PedersenHash | StarkKey | Hash256 | string
) {
  const digits = hash.startsWith('0x') ? hash.slice(2) : hash.toString()
  return '0x' + digits.toUpperCase()
}

export function formatHashShort(
  hash: PedersenHash | StarkKey | Hash256 | string
) {
  const longHash = formatHashLong(hash)
  return `${longHash.slice(0, 10)}…${longHash.slice(-8)}`
}
