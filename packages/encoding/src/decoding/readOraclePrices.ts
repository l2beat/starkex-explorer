import { AssetId } from '@explorer/types'

import { OraclePrice } from '../OnChainData'
import { ByteReader } from './ByteReader'
import { decodeAssetId } from './decodeAssetId'

export function readOraclePrices(
  reader: ByteReader,
  collateralAssetId?: AssetId
) {
  const count = reader.readNumber(32)
  const oraclePrices: OraclePrice[] = []
  for (let i = 0; i < count; i++) {
    reader.skip(17)
    const assetId = decodeAssetId(reader.read(15), collateralAssetId)
    const price = reader.readBigInt(32)
    oraclePrices.push({ assetId, price })
  }
  return oraclePrices
}
