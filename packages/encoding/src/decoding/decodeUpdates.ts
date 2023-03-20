import { AssetId } from '@explorer/types'

import { PositionUpdate } from '../OnChainData'
import { ByteReader } from './ByteReader'
import { readFundingEntries } from './readFundingEntries'
import { readPositionUpdate } from './readPositionUpdate'

export function decodeUpdates(data: string, collateralAssetId: AssetId) {
  const reader = new ByteReader(data)

  const funding = readFundingEntries(reader, collateralAssetId)

  const positions: PositionUpdate[] = []
  while (!reader.isAtEnd()) {
    positions.push(readPositionUpdate(reader, collateralAssetId))
  }

  return { funding, positions }
}
