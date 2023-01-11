import { ByteReader } from '../decoding/ByteReader'

export function readToDecode<T>(read: (reader: ByteReader) => T) {
  return function decode(data: string) {
    const reader = new ByteReader(data)
    const decoded = read(reader)
    reader.assertEnd()
    return decoded
  }
}
