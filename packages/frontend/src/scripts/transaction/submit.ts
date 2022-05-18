import { EthereumAddress } from '@explorer/types'

import { initSign } from './sign'
import { FormState } from './types'

export async function submit(state: FormState) {
  if (state.exitButtonSelected) {
    alert('Exit transaction')
    // TODO: implement
    return
  }

  const offer = {
    starkKeyA: state.props.publicKey,
    positionIdA: state.props.positionId.toString(),
    amountCollateral: state.totalInputValue.toString(),
    amountSynthetic: state.amountInputValue.toString(),
    syntheticAssetId: state.selectedAsset.assetId,
    aIsBuyingSynthetic: state.buyButtonSelected,
  }

  try {
    const signature = await initSign(
      offer,
      EthereumAddress('0x6235538E538067Db89E72d24F4D1a757E234Bed1')
    )

    fetch('/forced/offers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        offer,
        signature,
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        window.location.href = `/forced/${res.id}`
      })
      .catch(console.error)
  } catch (e) {
    console.error(e)
  }
}
