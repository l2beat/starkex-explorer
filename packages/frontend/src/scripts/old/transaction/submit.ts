import { CreateOfferData } from '@explorer/shared'

import { Api } from '../../peripherals/api'
import { Wallet } from '../../peripherals/wallet'
import { FormState } from './types'

export async function submit(state: FormState) {
  if (state.exitButtonSelected) {
    return submitExit(state)
  } else {
    return submitOffer(state)
  }
}

async function submitExit(state: FormState) {
  const hash = await Wallet.sendPerpetualForcedWithdrawalTransaction(
    state.props.account.address,
    state.props.starkKey,
    state.props.positionId,
    state.amountInputValue,
    false,
    state.props.perpetualAddress
  )

  await Api.submitPerpetualForcedWithdrawal(hash)
  window.location.href = `/forced/${hash.toString()}`
}

async function submitOffer(state: FormState) {
  const offer: CreateOfferData = {
    starkKeyA: state.props.starkKey,
    positionIdA: state.props.positionId,
    collateralAmount: state.totalInputValue,
    syntheticAmount: state.amountInputValue,
    syntheticAssetId: state.selectedAsset.assetId,
    isABuyingSynthetic: state.buyButtonSelected,
  }

  const signature = await Wallet.signOfferCreate(
    state.props.account.address,
    offer
  )

  const offerId = await Api.createOffer(offer, signature)
  window.location.href = `/forced/offers/${offerId}`
}
