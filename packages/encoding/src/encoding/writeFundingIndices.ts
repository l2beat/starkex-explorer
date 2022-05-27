import { MIN_INT } from '../constants'
import { FundingIndex } from '../OnChainData'
import { ByteWriter } from './ByteWriter'
import { encodeAssetId } from './encodeAssetId'

export function writeFundingIndices(
  writer: ByteWriter,
  indices: FundingIndex[]
) {
  writer.writeNumber(indices.length, 32)
  for (const { assetId, value } of indices) {
    writer.writePadding(17)
    writer.write(encodeAssetId(assetId), 15)
    writer.writeNumber(value - MIN_INT, 32)
  }
}
