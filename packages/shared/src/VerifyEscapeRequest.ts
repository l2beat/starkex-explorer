import { Interface } from '@ethersproject/abi'

const coder = new Interface([
  'function verifyEscape(uint256[],uint256,uint256[])',
])

export interface VerifyEscapeRequest {
  serializedMerkleProof: bigint[]
  assetCount: number
  serializedState: bigint[]
}

export function encodeVerifyEscapeRequest(data: VerifyEscapeRequest) {
  return coder.encodeFunctionData('verifyEscape', [
    data.serializedMerkleProof,
    data.assetCount,
    data.serializedState,
  ])
}
