import { decodeAssetId } from './assetId'
import { DecodingError } from './DecodingError'
import {
  AssetBalance,
  FundingEntry,
  FundingIndex,
  OnChainData,
  PositionUpdate,
} from './OnChainData'

const MIN_INT = -(2n ** 63n)

export function decode(data: string[]): OnChainData {
  let position = 0

  const fundingEntriesLength = hexToSafeInt(data[position++])
  const funding: FundingEntry[] = []
  for (let i = 0; i < fundingEntriesLength; i++) {
    const fundingIndicesLength = hexToSafeInt(data[position++])

    const indices: FundingIndex[] = []
    const end = position + fundingIndicesLength * 2
    for (; position < end; position += 2) {
      indices.push({
        assetId: hexToAssetId(data[position]),
        value: hexToBigInt(data[position + 1]) + MIN_INT,
      })
    }

    const timestamp = hexToBigInt(data[position++])
    funding.push({ indices, timestamp })
  }

  const positions: PositionUpdate[] = []
  while (position < data.length) {
    const stateValuesLength = hexToSafeInt(data[position++])
    const positionId = hexToBigInt(data[position++])
    const publicKey = hexToString(data[position++])
    const collateralBalance = hexToBigInt(data[position++]) + MIN_INT
    const fundingTimestamp = hexToBigInt(data[position++])

    const balances: AssetBalance[] = []
    const end = position + stateValuesLength - 4
    for (; position < end; position++) {
      const item = data[position]
      const assetId = hexToAssetId(item?.slice(72 / 4, (72 + 120) / 4))
      const balance = hexToBigInt(item?.slice((72 + 120) / 4)) + MIN_INT
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

export function hexToAssetId(value: string | undefined) {
  checkIntegrity(value)
  const last15bytes = value.substring(value.length - 30)
  return decodeAssetId(last15bytes)
}

function hexToBigInt(value: string | undefined) {
  checkIntegrity(value)
  return BigInt('0x' + value)
}

function hexToSafeInt(value: string | undefined) {
  checkIntegrity(value)
  const number = parseInt(value, 16)
  if (number > Number.MAX_SAFE_INTEGER) {
    throw new DecodingError('Number too large')
  }
  return number
}

function hexToString(value: string | undefined) {
  checkIntegrity(value)
  return '0x' + value
}

function checkIntegrity<T>(value: T | undefined): asserts value is T {
  if (value === undefined) {
    throw new DecodingError('Went out of bounds')
  }
}
