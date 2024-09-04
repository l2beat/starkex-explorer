import { Interface } from '@ethersproject/abi'
import { StarkKey } from '@explorer/types'

const coder = new Interface([
  'function withdraw(uint256 starkKey, uint256 assetType)',
])

export function encodeFinalizeExitRequest(starkKey: StarkKey) {
  return coder.encodeFunctionData('withdraw', [
    starkKey.toString(),
    //hardcoded just because it will take time to pass collateral asset to this function and it is going to be removed soon
    '0x02893294412a4c8f915f75892b395ebbf6859ec246ec365c3b1f56f47c3a0a5d',
  ])
}

export function decodeFinalizeExitRequest(data: string) {
  try {
    const decoded = coder.decodeFunctionData('withdraw', data)
    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call  */
    return {
      starkKey: StarkKey.from(decoded.starkKey),
      assetType: decoded.assetType.toHexString() as string,
    }
    /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call  */
  } catch {
    return
  }
}
