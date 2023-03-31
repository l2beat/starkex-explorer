import { Timestamp } from '@explorer/types'

import { FundingEntry } from '../OnChainData'
import { ByteReader } from './ByteReader'
import { readFundingIndices } from './readFundingIndices'

export function readFundingEntries(reader: ByteReader) {
  const count = reader.readNumber(32)
  const funding: FundingEntry[] = []
  for (let i = 0; i < count; i++) {
    const indices = readFundingIndices(reader)
    const timestamp = Timestamp.fromSeconds(reader.readNumber(32))
    funding.push({ indices, timestamp })
  }
  return funding
}
