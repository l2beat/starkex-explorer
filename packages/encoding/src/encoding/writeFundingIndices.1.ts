import { MIN_INT } from '../constants'
import { FundingIndex } from '../OnChainData'
import { ByteWriter } from './ByteWriter'
import { encodeAssetId } from './encodeAssetId'

export function writeFundingIndices(writer: ByteWriter, data: FundingIndex[]) {
  writer.writeNumber(data.length, 32)
  for (const { assetId, value } of data) {
    writer.writePadding(17)
    writer.write(encodeAssetId(assetId), 15)
    writer.writeNumber(value - MIN_INT, 32)
  }
}
