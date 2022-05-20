import { keccak256, pack } from '@ethersproject/solidity'
import { encodeAssetId } from '@explorer/encoding'
import { AssetId, EthereumAddress } from '@explorer/types'

import { AcceptedData, OfferData } from './types'

export async function signInitial(offer: OfferData, address: EthereumAddress) {
  const provider = window.ethereum

  if (!provider || !address) {
    return
  }

  const stringOffer = JSON.stringify(
    {
      starkKeyA: offer.starkKeyA,
      positionIdA: offer.positionIdA.toString(),
      syntheticAssetId: offer.syntheticAssetId,
      amountCollateral: offer.amountCollateral.toString(),
      amountSynthetic: offer.amountSynthetic.toString(),
      aIsBuyingSynthetic: offer.aIsBuyingSynthetic,
    },
    null,
    2
  )

  try {
    return (await provider.request({
      method: 'personal_sign',
      params: [address.toString(), stringOffer],
    })) as string
  } catch (e) {
    console.error(e)
  }
}

export async function signAccepted(
  offer: OfferData,
  accepted: AcceptedData,
  address: EthereumAddress
): Promise<string | undefined> {
  const provider = window.ethereum

  if (!provider || !address) {
    return
  }

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
      offer.amountCollateral,
      offer.amountSynthetic,
      offer.aIsBuyingSynthetic,
      accepted.nonce,
    ]
  )

  const actionHash = keccak256(
    ['string', 'bytes'],
    ['FORCED_TRADE', packedParameters]
  )

  const dataHashToSign = keccak256(
    ['bytes32', 'uint256'],
    [actionHash, accepted.submissionExpirationTime]
  )

  try {
    return (await provider.request({
      method: 'eth_sign',
      params: [address, dataHashToSign],
    })) as string
  } catch (e) {
    console.error(e)
  }
}
