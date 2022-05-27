import { OnChainData } from '../OnChainData'
import { ByteWriter } from './ByteWriter'
import { writeFundingIndices } from './writeFundingIndices.1'

export function writeFundingEntries(writer: ByteWriter, data: OnChainData) {
  writer.writeNumber(data.funding.length, 32)
  for (const { indices, timestamp } of data.funding) {
    writeFundingIndices(writer, indices)
    writer.writeNumber(Number(timestamp) / 1000, 32)
  }
}
