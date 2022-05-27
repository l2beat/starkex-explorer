import { ByteWriter } from './ByteWriter'

export function writeConditions(writer: ByteWriter, conditions: string[]) {
  writer.writeNumber(conditions.length, 32)
  for (const condition of conditions) {
    writer.write(condition, 32)
  }
}
