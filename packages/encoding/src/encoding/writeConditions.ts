import { PedersenHash } from '@explorer/types'

import { ByteWriter } from './ByteWriter'

export function writeConditions(
  writer: ByteWriter,
  conditions: PedersenHash[]
) {
  writer.writeNumber(conditions.length, 32)
  for (const condition of conditions) {
    writer.write(condition.toString(), 32)
  }
}
