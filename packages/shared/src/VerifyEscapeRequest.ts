import { Interface } from '@ethersproject/abi'

const verifyPerpetualEscapeRequestCoder = new Interface([
  'function verifyEscape(uint256[] merkleProof, uint256 nAssets, uint256[] sharedState)',
])

const verifySpotEscapeRequestCoder = new Interface([
  'function verifyEscape(uint256[] escapeProof)',
])
export interface VerifyPerpetualEscapeRequest {
  serializedMerkleProof: bigint[]
  assetCount: number
  serializedState: bigint[]
}

export function encodeVerifyPerpetualEscapeRequest(
  data: VerifyPerpetualEscapeRequest
) {
  return verifyPerpetualEscapeRequestCoder.encodeFunctionData('verifyEscape', [
    data.serializedMerkleProof,
    data.assetCount,
    data.serializedState,
  ])
}

export function validateVerifyPerpetualEscapeRequest(data: string) {
  try {
    verifyPerpetualEscapeRequestCoder.decodeFunctionData('verifyEscape', data)
    return true
  } catch {
    return false
  }
}

export interface VerifySpotEscapeRequest {
  serializedEscapeProof: bigint[]
}

export function encodeVerifySpotEscapeRequest(data: VerifySpotEscapeRequest) {
  return verifySpotEscapeRequestCoder.encodeFunctionData('verifyEscape', [
    data.serializedEscapeProof,
  ])
}

export function validateVerifySpotEscapeRequest(data: string) {
  try {
    verifySpotEscapeRequestCoder.decodeFunctionData('verifyEscape', data)
    return true
  } catch {
    return false
  }
}
