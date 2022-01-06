import { decodeAssetId } from './assetId'
import { ByteReader } from './ByteReader'
import { AssetDataHash } from './OnChainData'

export function readAssetDataHashes(reader: ByteReader) {
  const fundingIndicesLength = reader.readNumber(32)
  const assetDataHashes: AssetDataHash[] = []
  for (let i = 0; i < fundingIndicesLength; i++) {
    reader.skip(17)
    const assetId = decodeAssetId(reader.read(15))
    const hash = reader.readHex(32)
    assetDataHashes.push({ assetId, hash })
  }
  return assetDataHashes
}
