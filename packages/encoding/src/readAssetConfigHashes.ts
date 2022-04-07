import { ByteReader } from './ByteReader'
import { decodeAssetId } from './decodeAssetId'
import { AssetConfigHash } from './OnChainData'

export function readAssetConfigHashes(reader: ByteReader) {
  const count = reader.readNumber(32)
  const assetDataHashes: AssetConfigHash[] = []
  for (let i = 0; i < count; i++) {
    reader.skip(17)
    const assetId = decodeAssetId(reader.read(15))
    const hash = reader.readHex(32)
    assetDataHashes.push({ assetId, hash })
  }
  return assetDataHashes
}
