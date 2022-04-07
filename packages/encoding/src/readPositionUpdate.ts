import { Timestamp } from '@explorer/types'

import { ByteReader } from './ByteReader'
import { MIN_INT } from './constants'
import { decodeAssetId } from './decodeAssetId'
import { AssetBalance, PositionUpdate } from './OnChainData'

export function readPositionUpdate(reader: ByteReader): PositionUpdate {
  const count = reader.readNumber(32)
  const positionId = reader.readBigInt(32)
  const publicKey = reader.readHex(32)
  const collateralBalance = reader.readBigInt(32) + MIN_INT
  const fundingTimestamp = Timestamp.fromSeconds(reader.readNumber(32))

  const balances: AssetBalance[] = []
  for (let i = 0; i < count - 4; i++) {
    reader.skip(9)
    const assetId = decodeAssetId(reader.read(15))
    const balance = reader.readBigInt(8) + MIN_INT
    balances.push({ assetId, balance })
  }

  return {
    positionId,
    publicKey,
    collateralBalance,
    fundingTimestamp,
    balances,
  }
}
