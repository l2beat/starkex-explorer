import {
  CreateOfferData,
  encodeForcedWithdrawalRequest,
  serializeCreateOfferBody,
} from '@explorer/shared'
import { Hash256 } from '@explorer/types'

import * as Wallet from '../../peripherals/wallet'
import { FormState } from './types'

export async function submit(state: FormState) {
  if (state.exitButtonSelected) {
    return submitExit(state)
  } else {
    return submitOffer(state)
  }
}

async function submitExit(state: FormState) {
  const provider = window.ethereum
  if (!provider) {
    return
  }

  const data = encodeForcedWithdrawalRequest({
    starkKey: state.props.starkKey,
    positionId: state.props.positionId,
    quantizedAmount: state.amountInputValue,
    premiumCost: false,
  })

  const result = await provider.request({
    method: 'eth_sendTransaction',
    params: [
      {
        from: state.props.account.address,
        to: state.props.perpetualAddress,
        data,
      },
    ],
  })
  const hash = Hash256(result as string)

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
    isABuyingSynthetic: state.buyButtonSelected,
  }

  const signature = await Wallet.signCreate(state.props.account.address, offer)

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
