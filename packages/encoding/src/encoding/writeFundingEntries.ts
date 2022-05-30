import { FundingEntry } from '../OnChainData'
import { ByteWriter } from './ByteWriter'
import { toSeconds } from './toSeconds'
import { writeFundingIndices } from './writeFundingIndices'

export function writeFundingEntries(
  writer: ByteWriter,
  funding: FundingEntry[]
) {
  writer.writeNumber(funding.length, 32)
  for (const { indices, timestamp } of funding) {
    writeFundingIndices(writer, indices)
    writer.writeNumber(toSeconds(timestamp), 32)
  }
}
