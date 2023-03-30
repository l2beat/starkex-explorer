import { AssetId, PedersenHash } from '@explorer/types'

import { AssetConfigHash } from '../OnChainData'
import { ByteReader } from './ByteReader'
import { decodeAssetId } from './decodeAssetId'

export function readAssetConfigHashes(
  reader: ByteReader,
  collateralAssetId?: AssetId
) {
  const count = reader.readNumber(32)
  const assetDataHashes: AssetConfigHash[] = []
  for (let i = 0; i < count; i++) {
    reader.skip(17)
    const assetId = decodeAssetId(reader.read(15), collateralAssetId)
    const hash = PedersenHash(reader.readHex(32))
    assetDataHashes.push({ assetId, hash })
  }
  return assetDataHashes
}
