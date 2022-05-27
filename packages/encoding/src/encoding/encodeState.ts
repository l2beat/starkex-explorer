import { State } from '../OnChainData'
import { ByteWriter } from './ByteWriter'
import { toSeconds } from './toSeconds'
import { writeFundingIndices } from './writeFundingIndices'
import { writeOraclePrices } from './writeOraclePrices'

export function encodeState(state: State) {
  const writer = new ByteWriter()

  writer.write(state.positionRoot.toString(), 32)
  writer.writeNumber(state.positionHeight, 32)
  writer.write(state.orderRoot.toString(), 32)
  writer.writeNumber(state.orderHeight, 32)
  writeFundingIndices(writer, state.indices)
  writer.writeNumber(toSeconds(state.timestamp), 32)
  writeOraclePrices(writer, state.oraclePrices)
  writer.writeNumber(toSeconds(state.systemTime), 32)

  return writer.getBytes()
}
