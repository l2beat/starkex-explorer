import { ByteReader } from './ByteReader'
import { PositionUpdate } from './OnChainData'
import { readFundingEntries } from './readFundingEntries'
import { readPositionUpdate } from './readPositionUpdate'

export function decodeUpdates(data: string) {
  const reader = new ByteReader(data)

  const funding = readFundingEntries(reader)

  const positions: PositionUpdate[] = []
  while (!reader.isAtEnd()) {
    positions.push(readPositionUpdate(reader))
  }

  return { funding, positions }
}
