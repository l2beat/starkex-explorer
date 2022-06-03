import { StarkKey } from '@explorer/types'

import { Modification } from '../OnChainData'
import { ByteReader } from './ByteReader'

export function readModifications(reader: ByteReader) {
  const count = reader.readNumber(32)
  const modifications: Modification[] = []
  for (let i = 0; i < count; i++) {
    const starkKey = StarkKey(reader.readHex(32))
    const positionId = reader.readBigInt(32)
    const difference = reader.readBigInt(32) - 2n ** 64n
    modifications.push({ starkKey, positionId, difference })
  }
  return modifications
}
