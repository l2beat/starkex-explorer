interface OnChainData {
  funding: FundingEntry[]
  positions: PositionUpdate[]
}

interface FundingEntry {
  indices: FundingIndex[]
  timestamp: bigint
}

interface FundingIndex {
  assetId: bigint
  fundingIndex: bigint
}

interface PositionUpdate {
  positionId: bigint
  publicKey: bigint
  collateralBalance: bigint
  fundingTimestamp: bigint
  balances: AssetBalance[]
}

interface AssetBalance {
  assetId: bigint
  balance: bigint
}

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
        assetId: hexToBigInt(data[position]),
        fundingIndex: hexToBigInt(data[position + 1]) + MIN_INT,
      })
    }

    const timestamp = hexToBigInt(data[position++])
    funding.push({ indices, timestamp })
  }

  const positions: PositionUpdate[] = []
  while (position < data.length) {
    const stateValuesLength = hexToSafeInt(data[position++])
    const positionId = hexToBigInt(data[position++])
    const publicKey = hexToBigInt(data[position++])
    const collateralBalance = hexToBigInt(data[position++]) + MIN_INT
    const fundingTimestamp = hexToBigInt(data[position++])

    const balances: AssetBalance[] = []
    const end = position + stateValuesLength - 4
    for (; position < end; position++) {
      const assetId = hexToBigInt(data[position]?.slice(72 / 4, (72 + 120) / 4))
      const balance =
        hexToBigInt(data[position]?.slice((72 + 120) / 4)) + MIN_INT
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

function hexToBigInt(value: string | undefined) {
  if (value === undefined) {
    throw new TypeError('Data malformed')
  }
  return BigInt('0x' + value)
}

function hexToSafeInt(value: string | undefined) {
  if (value === undefined) {
    throw new TypeError('Data malformed')
  }
  const number = parseInt(value, 16)
  if (number > Number.MAX_SAFE_INTEGER) {
    throw new TypeError('Data malformed')
  }
  return number
}
