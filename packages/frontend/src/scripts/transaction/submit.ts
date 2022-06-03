import {
  CreateOfferData,
  encodeForcedWithdrawalRequest,
  serializeCreateOfferBody,
} from '@explorer/shared'
import { Hash256 } from '@explorer/types'

import { signCreate } from '../offer/sign'
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
    starkKey: state.props.publicKey,
    vaultId: state.props.positionId,
    quantizedAmount: state.amountInputValue,
    premiumCost: false,
  })

  const result = await provider.request({
    method: 'eth_sendTransaction',
    params: [
      {
        from: state.props.account,
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

  window.location.href = `/forced/${hash}`
}

async function submitOffer(state: FormState) {
  const offer: CreateOfferData = {
    starkKeyA: state.props.publicKey,
    positionIdA: state.props.positionId,
    amountCollateral: state.totalInputValue,
    amountSynthetic: state.amountInputValue,
    syntheticAssetId: state.selectedAsset.assetId,
    aIsBuyingSynthetic: state.buyButtonSelected,
  }

  const signature = await signCreate(offer, state.props.account.address)

  if (!signature) {
    console.error('Offer parameters need to be signed.')
    return
  }

  fetch('/forced/offers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: serializeCreateOfferBody({ offer, signature }),
  })
    .then((res) => res.json())
    .then((res) => {
      window.location.href = `/forced/offers/${res.id}`
    })
    .catch(console.error)
}
