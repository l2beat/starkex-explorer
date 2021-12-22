import { decodeAssetId } from './assetId'
import { ByteReader } from './ByteReader'
import { MIN_INT } from './decodeFirstPage'
import { FundingIndex } from './OnChainData'

export function readFundingIndices(reader: ByteReader) {
  const fundingIndicesLength = reader.readNumber(32)
  const indices: FundingIndex[] = []
  for (let i = 0; i < fundingIndicesLength; i++) {
    reader.skip(17)
    const assetId = decodeAssetId(reader.read(15))
    const value = reader.readBigInt(32) + MIN_INT
    indices.push({ assetId, value })
  }
  return indices
}
