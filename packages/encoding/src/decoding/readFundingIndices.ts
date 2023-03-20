import { AssetId } from '@explorer/types'

import { MIN_INT } from '../constants'
import { FundingIndex } from '../OnChainData'
import { ByteReader } from './ByteReader'
import { decodeAssetId } from './decodeAssetId'

export function readFundingIndices(
  reader: ByteReader,
  collateralAssetId: AssetId
) {
  const count = reader.readNumber(32)
  const indices: FundingIndex[] = []
  for (let i = 0; i < count; i++) {
    reader.skip(17)
    const assetId = decodeAssetId(reader.read(15), collateralAssetId)
    const value = reader.readBigInt(32) + MIN_INT
    indices.push({ assetId, value })
  }
  return indices
}
