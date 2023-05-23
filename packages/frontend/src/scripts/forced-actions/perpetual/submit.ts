import { CreateOfferData } from '@explorer/shared'

import { Api } from '../../peripherals/api'
import { Wallet } from '../../peripherals/wallet'
import { FormState } from './types'
import { isBuyable } from './utils'

export async function submit(state: FormState) {
  if (state.assetId === state.props.collateralAsset.assetId) {
    return submitExit(state)
  } else {
    return submitOffer(state)
  }
}

async function submitExit(state: FormState) {
  const hash = await Wallet.sendPerpetualForcedWithdrawalTransaction(
    state.user.address,
    state.props.starkKey,
    state.props.positionOrVaultId,
    state.amountInputValue,
    false,
    state.props.starkExAddress
  )

  await Api.submitPerpetualForcedWithdrawal(hash)
  window.location.href = `/transactions/${hash.toString()}`
}

async function submitOffer(state: FormState) {
  const offer: CreateOfferData = {
    starkKeyA: state.props.starkKey,
    positionIdA: state.props.positionOrVaultId,
    collateralAmount: state.totalInputValue,
    syntheticAmount: state.amountInputValue,
    syntheticAssetId: state.assetId,
    isABuyingSynthetic: isBuyable(
      state.assetId,
      state.balance,
      state.props.collateralAsset
    ),
  }

  const signature = await Wallet.signOfferCreate(state.user.address, offer)

  const offerId = await Api.createOffer(offer, signature)
  window.location.href = `/offers/${offerId}`
}
