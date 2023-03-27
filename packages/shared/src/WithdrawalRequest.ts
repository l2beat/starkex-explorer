import { Interface } from '@ethersproject/abi'
import { AssetHash, StarkKey } from '@explorer/types'

const coder = new Interface([
  'function withdraw(uint256 ownerKey, uint256 assetType)',
])

export interface WithdrawalRequest {
  starkKey: StarkKey
  assetTypeHash: AssetHash
}

export function encodeWithdrawal(data: WithdrawalRequest) {
  return coder.encodeFunctionData('withdraw', [
    data.starkKey.toString(),
    data.assetTypeHash,
  ])
}

export function decodeWithdrawal(data: string): WithdrawalRequest | undefined {
  try {
    const decoded = coder.decodeFunctionData('withdraw', data)

    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call  */
    return {
      starkKey: StarkKey.from(decoded.ownerKey),
      assetTypeHash: AssetHash(decoded.assetType.toHexString()),
    }
    /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call  */
  } catch {
    return
  }
}
