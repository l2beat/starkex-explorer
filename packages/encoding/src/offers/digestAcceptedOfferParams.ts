import { AssetId, StarkKey } from '@explorer/types'
import { solidityKeccak256, solidityPack } from 'ethers/lib/utils'

import { encodeAssetId } from '../encodeAssetId'

export function digestAcceptedOfferParams(
  offer: {
    starkKeyA: StarkKey
    positionIdA: bigint
    syntheticAssetId: AssetId
    amountCollateral: bigint
    amountSynthetic: bigint
    aIsBuyingSynthetic: boolean
  },
  accepted: {
    starkKeyB: StarkKey
    positionIdB: bigint
    nonce: bigint
    submissionExpirationTime: bigint
  }
) {
  const packedParameters = solidityPack(
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
      offer.amountCollateral,
      offer.amountSynthetic,
      offer.aIsBuyingSynthetic,
      accepted.nonce,
    ]
  )

  const actionHash = solidityKeccak256(
    ['string', 'bytes'],
    ['FORCED_TRADE', packedParameters]
  )

  const digestToSign = solidityKeccak256(
    ['bytes32', 'uint256'],
    [actionHash, accepted.submissionExpirationTime]
  )
  return digestToSign
}
