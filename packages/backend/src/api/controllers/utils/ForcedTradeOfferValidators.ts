import { AssetBalance } from '@explorer/encoding'
import {
  CollateralAsset,
  toSignableAcceptOffer,
  toSignableCancelOffer,
  toSignableCreateOffer,
} from '@explorer/shared'
import { AssetId, EthereumAddress } from '@explorer/types'
import { hashMessage, recoverAddress } from 'ethers/lib/utils'

import {
  Accepted,
  ForcedTradeOfferRecord,
} from '../../../peripherals/database/ForcedTradeOfferRepository'
import { PositionRecord } from '../../../peripherals/database/PositionRepository'

export function validateSyntheticBalance(
  syntheticAmount: bigint,
  syntheticAssetId: AssetId,
  positionBalances: readonly AssetBalance[]
): boolean {
  const syntheticBalance =
    positionBalances.find((b) => b.assetId === syntheticAssetId)?.balance ?? 0n
  return syntheticAmount <= syntheticBalance
}

function validateSignature(
  digest: string,
  signature: string,
  address: EthereumAddress
): boolean {
  try {
    const signer = recoverAddress(digest, signature)
    return signer === address.toString()
  } catch (error) {
    return false
  }
}

function validatePersonalSignature(
  request: string,
  signature: string,
  address: EthereumAddress
): boolean {
  const toSign = hashMessage(request)
  return validateSignature(toSign, signature, address)
}

export function validateCreateSignature(
  offer: Omit<ForcedTradeOfferRecord, 'createdAt' | 'id'>,
  signature: string,
  address: EthereumAddress
) {
  const request = toSignableCreateOffer(offer)
  return validatePersonalSignature(request, signature, address)
}

export function validateAcceptSignature(
  offer: Omit<ForcedTradeOfferRecord, 'createdAt' | 'id'>,
  accepted: Omit<Accepted, 'at' | 'premiumCost'>,
  address: EthereumAddress,
  collateralAsset: CollateralAsset
): boolean {
  const request = toSignableAcceptOffer(offer, accepted, collateralAsset)
  return validateSignature(request, accepted.signature, address)
}

export function validateCreate(
  offer: Omit<ForcedTradeOfferRecord, 'createdAt' | 'id'>,
  positionA: PositionRecord,
  signature: string,
  addressA: EthereumAddress
) {
  const balanceValid =
    offer.isABuyingSynthetic ||
    validateSyntheticBalance(
      offer.syntheticAmount,
      offer.syntheticAssetId,
      positionA.balances
    )

  const signatureValid = validateCreateSignature(offer, signature, addressA)
  return balanceValid && signatureValid
}

export function validateCancel(
  offerId: ForcedTradeOfferRecord['id'],
  address: EthereumAddress,
  signature: string
): boolean {
  const request = toSignableCancelOffer(offerId)
  return validatePersonalSignature(request, signature, address)
}
