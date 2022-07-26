import { Interface } from '@ethersproject/abi'
import { EthereumAddress } from '@explorer/types'

const coder = new Interface(['function withdraw(uint256 _eth, uint256 _wei)'])

export function encodeFinalizeExitRequest(eth: bigint, wei: bigint) {
  return coder.encodeFunctionData('withdraw'), [eth, wei]
}

export function decodeFinalizeExitRequest(data: string) {
  try {
    const decoded = coder.decodeFunctionData('withdraw', data)
    return {
      eth: EthereumAddress(decoded._eth),
      wei: EthereumAddress(decoded._wei),
    }
  } catch {
    return
  }
}
