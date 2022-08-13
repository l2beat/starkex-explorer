import { Interface } from '@ethersproject/abi'
import { StarkKey } from '@explorer/types'

const coder = new Interface([
  `function forcedWithdrawalRequest(
      uint256 starkKey,
      uint256 positionId,
      uint256 quantizedAmount,
      bool premiumCost
    )`,
])

export interface ForcedWithdrawalRequest {
  starkKey: StarkKey
  positionId: bigint
  quantizedAmount: bigint
  premiumCost: boolean
}

export function decodeForcedWithdrawalRequest(
  data: string
): ForcedWithdrawalRequest | undefined {
  try {
    const decoded = coder.decodeFunctionData('forcedWithdrawalRequest', data)
    /* eslint-disable @typescript-eslint/no-unsafe-argument */
    return {
      starkKey: StarkKey.from(decoded.starkKey),
      positionId: BigInt(decoded.positionId),
      quantizedAmount: BigInt(decoded.quantizedAmount),
      premiumCost: Boolean(decoded.premiumCost),
    }
    /* eslint-enable @typescript-eslint/no-unsafe-argument */
  } catch {
    return
  }
}

export function encodeForcedWithdrawalRequest(data: ForcedWithdrawalRequest) {
  return coder.encodeFunctionData('forcedWithdrawalRequest', [
    data.starkKey,
    data.positionId.toString(),
    data.quantizedAmount.toString(),
    data.premiumCost,
  ])
}
