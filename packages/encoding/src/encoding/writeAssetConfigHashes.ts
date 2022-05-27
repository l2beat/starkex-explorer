import { OnChainData } from '../OnChainData'
import { ByteWriter } from './ByteWriter'
import { encodeAssetId } from './encodeAssetId'

export function writeAssetConfigHashes(writer: ByteWriter, data: OnChainData) {
  writer.writeNumber(data.assetConfigHashes.length, 32)
  for (const { assetId, hash } of data.assetConfigHashes) {
    writer.writePadding(17)
    writer.write(encodeAssetId(assetId), 15)
    writer.write(hash, 32)
  }
}
