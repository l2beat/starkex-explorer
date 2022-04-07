import { ByteReader } from './ByteReader'
import { MIN_INT } from './constants'
import { decodeAssetId } from './decodeAssetId'
import { FundingIndex } from './OnChainData'

export function readFundingIndices(reader: ByteReader) {
  const count = reader.readNumber(32)
  const indices: FundingIndex[] = []
  for (let i = 0; i < count; i++) {
    reader.skip(17)
    const assetId = decodeAssetId(reader.read(15))
    const value = reader.readBigInt(32) + MIN_INT
    indices.push({ assetId, value })
  }
  return indices
}
