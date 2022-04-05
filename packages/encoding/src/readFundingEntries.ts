import { Timestamp } from '@explorer/types'

import { ByteReader } from './ByteReader'
import { FundingEntry } from './OnChainData'
import { readFundingIndices } from './readFundingIndices'

export function readFundingEntries(reader: ByteReader) {
  const fundingEntriesLength = reader.readNumber(32)
  const funding: FundingEntry[] = []
  for (let i = 0; i < fundingEntriesLength; i++) {
    const indices = readFundingIndices(reader)
    const timestamp = Timestamp(reader.readNumber(32))
    funding.push({ indices, timestamp })
  }
  return funding
}
