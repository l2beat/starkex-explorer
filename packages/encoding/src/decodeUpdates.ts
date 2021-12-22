import { decodeAssetId } from './assetId'
import { ByteReader } from './ByteReader'
import {
  AssetBalance,
  FundingEntry,
  FundingIndex,
  OnChainData,
  PositionUpdate,
} from './OnChainData'

const MIN_INT = -(2n ** 63n)

export function decodeUpdates(data: string): OnChainData {
  const reader = new ByteReader(data)

  const fundingEntriesLength = reader.readNumber(32)
  const funding: FundingEntry[] = []
  for (let i = 0; i < fundingEntriesLength; i++) {
    const fundingIndicesLength = reader.readNumber(32)
    const indices: FundingIndex[] = []
    for (let i = 0; i < fundingIndicesLength; i++) {
      reader.skip(17)
      const assetId = decodeAssetId(reader.read(15))
      const value = reader.readBigInt(32) + MIN_INT
      indices.push({ assetId, value })
    }
    const timestamp = reader.readBigInt(32)
    funding.push({ indices, timestamp })
  }

  const positions: PositionUpdate[] = []
  while (!reader.isAtEnd()) {
    const stateValuesLength = reader.readNumber(32)
    const positionId = reader.readBigInt(32)
    const publicKey = '0x' + reader.read(32)
    const collateralBalance = reader.readBigInt(32) + MIN_INT
    const fundingTimestamp = reader.readBigInt(32)

    const balances: AssetBalance[] = []
    for (let i = 0; i < stateValuesLength - 4; i++) {
      reader.skip(9)
      const assetId = decodeAssetId(reader.read(15))
      const balance = reader.readBigInt(8) + MIN_INT
      balances.push({ assetId, balance })
    }

    positions.push({
      positionId,
      publicKey,
      collateralBalance,
      fundingTimestamp,
      balances,
    })
  }

  return { funding, positions }
}
