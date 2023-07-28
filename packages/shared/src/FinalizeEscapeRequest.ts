import { Interface } from '@ethersproject/abi'
import { StarkKey } from '@explorer/types'

const coder = new Interface(['function escape(uint256,uint256,uint256)'])

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
