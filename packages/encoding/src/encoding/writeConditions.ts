import { OnChainData } from '../OnChainData'
import { ByteWriter } from './ByteWriter'

export function writeConditions(writer: ByteWriter, data: OnChainData) {
  writer.writeNumber(data.conditions.length, 32)
  for (const condition of data.conditions) {
    writer.write(condition, 32)
  }
}
