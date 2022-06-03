import { keccak256, pack } from '@ethersproject/solidity'
import { encodeAssetId } from '@explorer/encoding'
import { AssetId, StarkKey } from '@explorer/types'

export function toSignableAcceptOffer(
  offer: {
    starkKeyA: StarkKey
    positionIdA: bigint
    syntheticAssetId: AssetId
    collateralAmount: bigint
    syntheticAmount: bigint
    isABuyingSynthetic: boolean
  },
  accepted: {
    starkKeyB: StarkKey
    positionIdB: bigint
    nonce: bigint
    submissionExpirationTime: bigint
  }
) {
  const packedParameters = pack(
    [
      'uint256',
      'uint256',
      'uint256',
      'uint256',
      'uint256',
      'uint256',
      'uint256',
      'uint256',
      'bool',
      'uint256',
    ],
    [
      offer.starkKeyA,
      accepted.starkKeyB,
      offer.positionIdA,
      accepted.positionIdB,
      `0x${encodeAssetId(AssetId.USDC)}`,
      `0x${encodeAssetId(offer.syntheticAssetId)}`,
      offer.collateralAmount,
      offer.syntheticAmount,
      offer.isABuyingSynthetic,
      accepted.nonce,
    ]
  )

  const actionHash = keccak256(
    ['string', 'bytes'],
    ['FORCED_TRADE', packedParameters]
  )

  const digestToSign = keccak256(
    ['bytes32', 'uint256'],
    [actionHash, accepted.submissionExpirationTime]
  )
  return digestToSign
}
