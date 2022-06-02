import { Interface } from '@ethersproject/abi'
import { StarkKey } from '@explorer/types'

const coder = new Interface([
  `function forcedWithdrawalRequest(
      uint256 starkKey,
      uint256 vaultId,
      uint256 quantizedAmount,
      bool premiumCost
    )`,
])

export interface ForcedWithdrawalRequest {
  starkKey: StarkKey
  vaultId: bigint
  quantizedAmount: bigint
  premiumCost: boolean
}

export function decodeForcedWithdrawalRequest(
  data: string
): ForcedWithdrawalRequest | undefined {
  try {
    const decoded = coder.decodeFunctionData('forcedWithdrawalRequest', data)
    return {
      starkKey: StarkKey.from(decoded.starkKey),
      vaultId: BigInt(decoded.vaultId),
      quantizedAmount: BigInt(decoded.quantizedAmount),
      premiumCost: Boolean(decoded.premiumCost),
    }
  } catch {
    return
  }
}

export function encodeForcedWithdrawalRequest(data: ForcedWithdrawalRequest) {
  return coder.encodeFunctionData('forcedWithdrawalRequest', [
    data.starkKey,
    data.vaultId.toString(),
    data.quantizedAmount.toString(),
    data.premiumCost,
  ])
}
