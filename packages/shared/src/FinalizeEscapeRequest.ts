import { Interface } from '@ethersproject/abi'
import { StarkKey } from '@explorer/types'

const coder = new Interface([
  'function escape(uint256 starkKey, uint256 vaultId, uint256 quantizedAmount)',
])

export interface FinalizeEscapeRequest {
  starkKey: StarkKey
  positionOrVaultId: bigint
  quantizedAmount: bigint
}

export function encodeFinalizeEscapeRequest(data: FinalizeEscapeRequest) {
  return coder.encodeFunctionData('escape', [
    data.starkKey.toString(),
    data.positionOrVaultId,
    data.quantizedAmount,
  ])
}

export function decodeFinalizeEscapeRequest(
  data: string
): FinalizeEscapeRequest {
  const decoded = coder.decodeFunctionData('escape', data)
  /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call  */
  return {
    starkKey: StarkKey.from(decoded.starkKey),
    positionOrVaultId: BigInt(decoded.vaultId),
    quantizedAmount: BigInt(decoded.quantizedAmount),
  }
  /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call  */
}
