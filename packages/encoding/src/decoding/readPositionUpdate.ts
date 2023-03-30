import { AssetId, StarkKey, Timestamp } from '@explorer/types'

import { MIN_INT } from '../constants'
import { AssetBalance, PositionUpdate } from '../OnChainData'
import { ByteReader } from './ByteReader'
import { decodeAssetId } from './decodeAssetId'

export function readPositionUpdate(
  reader: ByteReader,
  collateralAssetId?: AssetId
): PositionUpdate {
  const count = reader.readNumber(32)
  const positionId = reader.readBigInt(32)
  const starkKey = StarkKey(reader.readHex(32))
  const collateralBalance = reader.readBigInt(32) + MIN_INT
  const fundingTimestamp = Timestamp.fromSeconds(reader.readNumber(32))

  const balances: AssetBalance[] = []
  for (let i = 0; i < count - 4; i++) {
    reader.skip(9)
    const assetId = decodeAssetId(reader.read(15), collateralAssetId)
    const balance = reader.readBigInt(8) + MIN_INT
    balances.push({ assetId, balance })
  }

  return {
    positionId,
    starkKey,
    collateralBalance,
    fundingTimestamp,
    balances,
  }
}
