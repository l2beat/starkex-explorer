import { Interface } from '@ethersproject/abi'
import { StarkKey } from '@explorer/types'

const coder = new Interface(['function freezeRequest(uint256,uint256,uint256)'])

export interface FreezeRequest {
  ownerKey: StarkKey
  positionOrVaultId: bigint
  quantizedAmount: bigint
}

export function encodeFreezeRequest(data: FreezeRequest) {
  return coder.encodeFunctionData('freezeRequest', [
    data.ownerKey,
    data.positionOrVaultId.toString(),
    data.quantizedAmount.toString(),
  ])
}
