import { Hash256, PedersenHash, StarkKey } from '@explorer/types'

import { formatHashLong } from './formatHashLong'

export function formatHashShort(
  hash: PedersenHash | StarkKey | Hash256 | string
) {
  const longHash = formatHashLong(hash)
  return `${longHash.slice(0, 10)}…${longHash.slice(-8)}`
}
