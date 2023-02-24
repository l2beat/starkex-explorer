import { CreateOfferData, serializeCreateOfferBody } from '@explorer/shared'
import { AssetId } from '@explorer/types'

import * as Wallet from '../peripherals/wallet'
import { FormState } from './types'
import { isBuyable } from './utils'

export async function submit(state: FormState) {
  if (state.props.selectedAsset === AssetId.USDC) {
    return submitExit(state)
  } else {
    return submitOffer(state)
  }
}

async function submitExit(state: FormState) {
  const hash = await Wallet.sendPerpetualForcedWithdrawalTransaction(
    state.props.user.address,
    state.props.starkKey,
    state.props.positionId,
    state.amountInputValue,
    false,
    state.props.perpetualAddress
  )
  await fetch('/forced/exits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hash }),
  })

  window.location.href = `/forced/${hash.toString()}`
}

async function submitOffer(state: FormState) {
  const offer: CreateOfferData = {
    starkKeyA: state.props.starkKey,
    positionIdA: state.props.positionId,
    collateralAmount: state.totalInputValue,
    syntheticAmount: state.amountInputValue,
    syntheticAssetId: state.selectedAsset.assetId,
    isABuyingSynthetic: isBuyable(state.selectedAsset),
  }

  const signature = await Wallet.signCreate(state.props.user.address, offer)

  fetch('/forced/offers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: serializeCreateOfferBody({ offer, signature }),
  })
    .then((res) => res.json())
    .then((res) => {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-unsafe-member-access
      window.location.href = `/forced/offers/${res.id}`
    })
    .catch(console.error)
}
