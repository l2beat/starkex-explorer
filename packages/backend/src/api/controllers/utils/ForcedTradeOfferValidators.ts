import {
  getAcceptRequest,
  getCancelRequest,
  getCreateRequest,
} from '@explorer/shared'
import { EthereumAddress } from '@explorer/types'
import { hashMessage, recoverAddress } from 'ethers/lib/utils'

import {
  Accepted,
  ForcedTradeOfferRecord,
} from '../../../peripherals/database/ForcedTradeOfferRepository'
import { PositionRecord } from '../../../peripherals/database/PositionRepository'

export function validateCreate(
  offer: Omit<ForcedTradeOfferRecord, 'createdAt' | 'id'>,
  position: PositionRecord,
  signature: string,
  ethAddressA: EthereumAddress
) {
  const userIsBuyingSynthetic = offer.aIsBuyingSynthetic

  if (!validateBalance(offer, position, userIsBuyingSynthetic)) {
    return false
  }

  return validateCreateSignature(offer, signature, ethAddressA)
}

export function validateAccept(
  offer: ForcedTradeOfferRecord,
  accepted: Omit<Accepted, 'at'>,
  position: PositionRecord,
  ethAddressB: EthereumAddress
) {
  const userIsBuyingSynthetic = !offer.aIsBuyingSynthetic

  if (!validateBalance(offer, position, userIsBuyingSynthetic)) {
    return false
  }

  return validateAcceptSignature(offer, accepted, ethAddressB)
}

export function validateCancel(
  offerId: ForcedTradeOfferRecord['id'],
  address: EthereumAddress,
  signature: string
): boolean {
  const request = getCancelRequest(offerId)
  return validatePersonalSignature(request, signature, address)
}

function validateBalance(
  offer: Omit<ForcedTradeOfferRecord, 'createdAt' | 'id'>,
  position: PositionRecord,
  userIsBuyingSynthetic: boolean
) {
  const { amountCollateral, amountSynthetic, syntheticAssetId } = offer

  const { collateralBalance } = position

  if (userIsBuyingSynthetic && amountCollateral <= collateralBalance) {
    return true
  }

  if (!userIsBuyingSynthetic) {
    const balanceSynthetic = position.balances.find(
      (balance) => balance.assetId === syntheticAssetId
    )?.balance
    if (balanceSynthetic && balanceSynthetic >= amountSynthetic) {
      return true
    }
  }

  return false
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
  const request = getCreateRequest(offer)
  return validatePersonalSignature(request, signature, address)
}

export function validateAcceptSignature(
  offer: Omit<ForcedTradeOfferRecord, 'createdAt' | 'id'>,
  accepted: Omit<Accepted, 'at' | 'premiumCost'>,
  address: EthereumAddress
): boolean {
  const request = getAcceptRequest(offer, accepted)
  return validateSignature(request, accepted.signature, address)
}
