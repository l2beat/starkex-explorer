import { ByteReader } from './ByteReader'

export function readConditions(reader: ByteReader) {
  const count = reader.readNumber(32)
  const conditions: string[] = []
  for (let i = 0; i < count; i++) {
    const condition = reader.readHex(32)
    conditions.push(condition)
  }
  return conditions
}
