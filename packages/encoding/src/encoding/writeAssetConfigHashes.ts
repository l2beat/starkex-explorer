import { AssetConfigHash } from '../OnChainData'
import { ByteWriter } from './ByteWriter'
import { encodeAssetId } from './encodeAssetId'

export function writeAssetConfigHashes(
  writer: ByteWriter,
  assetConfigHashes: AssetConfigHash[]
) {
  writer.writeNumber(assetConfigHashes.length, 32)
  for (const { assetId, hash } of assetConfigHashes) {
    writer.writePadding(17)
    writer.write(encodeAssetId(assetId), 15)
    writer.write(hash.toString(), 32)
  }
}
