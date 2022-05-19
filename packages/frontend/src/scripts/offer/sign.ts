import { keccak256, pack } from '@ethersproject/solidity'
import { encodeAssetId } from '@explorer/encoding'
import { AssetId, EthereumAddress } from '@explorer/types'

import {
  ForcedTradeAcceptedOfferEntry,
  ForcedTradeInitialOfferEntry,
} from '../transaction/types'

export async function signInitial(
  offer: ForcedTradeInitialOfferEntry,
  address: EthereumAddress
) {
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
  initialOffer: ForcedTradeInitialOfferEntry,
  acceptedOffer: ForcedTradeAcceptedOfferEntry,
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
      initialOffer.starkKeyA,
      acceptedOffer.starkKeyB,
      initialOffer.positionIdA,
      acceptedOffer.positionIdB,
      `0x${encodeAssetId(AssetId.USDC)}`,
      `0x${encodeAssetId(initialOffer.syntheticAssetId)}`,
      initialOffer.amountCollateral,
      initialOffer.amountSynthetic,
      initialOffer.aIsBuyingSynthetic,
      acceptedOffer.nonce,
    ]
  )

  const actionHash = keccak256(
    ['string', 'bytes'],
    ['FORCED_TRADE', packedParameters]
  )

  const dataHashToSign = keccak256(
    ['bytes32', 'uint256'],
    [actionHash, acceptedOffer.submissionExpirationTime]
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
