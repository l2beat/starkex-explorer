import { State } from '../OnChainData'
import { ByteWriter } from './ByteWriter'
import { writeFundingIndices } from './writeFundingIndices'
import { writeOraclePrices } from './writeOraclePrices'

export function encodeState(data: State) {
  const writer = new ByteWriter()

  writer.write(data.positionRoot, 32)
  writer.writeNumber(data.positionHeight, 32)
  writer.write(data.orderRoot, 32)
  writer.writeNumber(data.orderHeight, 32)
  writeFundingIndices(writer, data)
  writer.writeNumber(+data.timestamp / 1000, 32)
  writeOraclePrices(writer, data)
  writer.writeNumber(+data.systemTime / 1000, 32)

  return writer.getBytes()
}
