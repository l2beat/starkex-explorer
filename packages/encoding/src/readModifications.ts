import { StarkKey } from '@explorer/types'

import { ByteReader } from './ByteReader'
import { Modification } from './OnChainData'

export function readModifications(reader: ByteReader) {
  const count = reader.readNumber(32)
  const modifications: Modification[] = []
  for (let i = 0; i < count; i++) {
    const publicKey = StarkKey(reader.readHex(32))
    const positionId = reader.readBigInt(32)
    const difference = reader.readBigInt(32) - 2n ** 64n
    modifications.push({ publicKey, positionId, difference })
  }
  return modifications
}
