import { PedersenHash } from '@explorer/types'

import { ByteReader } from './ByteReader'

export function readConditions(reader: ByteReader) {
  const count = reader.readNumber(32)
  const conditions: PedersenHash[] = []
  for (let i = 0; i < count; i++) {
    const condition = PedersenHash(reader.readHex(32))
    conditions.push(condition)
  }
  return conditions
}
