import { signCreate } from '../offer/sign'
import { FormState } from './types'

export async function submit(state: FormState) {
  if (state.exitButtonSelected) {
    alert('Exit transaction')
    // TODO: implement
    return
  }

  const offer = {
    starkKeyA: state.props.publicKey,
    positionIdA: state.props.positionId,
    amountCollateral: state.totalInputValue,
    amountSynthetic: state.amountInputValue,
    syntheticAssetId: state.selectedAsset.assetId,
    aIsBuyingSynthetic: state.buyButtonSelected,
  }

  const signature = await signCreate(offer, state.props.account)

  if (!signature) {
    console.error('Offer parameters need to be signed.')
    return
  }

  fetch('/forced/offers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(
      {
        offer,
        signature,
      },
      (_, value: unknown) =>
        typeof value === 'bigint' ? value.toString() : value
    ),
  })
    .then((res) => res.json())
    .then((res) => {
      window.location.href = `/forced/${res.id}`
    })
    .catch(console.error)
}
