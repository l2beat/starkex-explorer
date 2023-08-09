import { Interface } from '@ethersproject/abi'

const coder = new Interface([
  'function verifyEscape(uint256[] merkleProof, uint256 nAssets, uint256[] sharedState)',
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

export function validateVerifyEscapeRequest(data: string) {
  try {
    coder.decodeFunctionData('verifyEscape', data)
    return true
  } catch {
    return false
  }
}
