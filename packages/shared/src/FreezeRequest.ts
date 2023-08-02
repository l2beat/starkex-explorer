import { Interface } from '@ethersproject/abi'
import { StarkKey } from '@explorer/types'

const coder = new Interface([
  'function freezeRequest(uint256 starkKey, uint256 vaultId, uint256 quantizedAmount)',
])

export interface FreezeRequest {
  starkKey: StarkKey
  positionOrVaultId: bigint
  quantizedAmount: bigint
}

export function encodeFreezeRequest(data: FreezeRequest) {
  return coder.encodeFunctionData('freezeRequest', [
    data.starkKey,
    data.positionOrVaultId.toString(),
    data.quantizedAmount.toString(),
  ])
}

export function decodeFreezeRequest(data: string): FreezeRequest {
  const decoded = coder.decodeFunctionData('freezeRequest', data)
  /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call  */
  return {
    starkKey: StarkKey.from(decoded.starkKey),
    positionOrVaultId: BigInt(decoded.vaultId),
    quantizedAmount: BigInt(decoded.quantizedAmount),
  }
  /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call  */
}
