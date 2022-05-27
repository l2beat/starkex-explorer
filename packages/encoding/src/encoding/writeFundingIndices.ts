import { MIN_INT } from '../constants'
import { State } from '../OnChainData'
import { ByteWriter } from './ByteWriter'
import { encodeAssetId } from './encodeAssetId'

export function writeFundingIndices(writer: ByteWriter, data: State) {
  writer.writeNumber(data.indices.length, 32)
  for (const { assetId, value } of data.indices) {
    writer.writePadding(17)
    writer.write(encodeAssetId(assetId), 15)
    writer.writeNumber(value - MIN_INT, 32)
  }
}
