
import { ByteReader } from './ByteReader'
import { decodeState } from './decodeState'

export function readState(reader: ByteReader) {
  const stateSize = reader.readNumber(32)
  const stateData = reader.read(stateSize * 32)
  return decodeState(stateData)
}
