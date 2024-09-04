import {
  deserializeCollateralAsset,
  deserializeFinalizeOfferData,
} from '@explorer/shared'
import { EthereumAddress } from '@explorer/types'

// eslint-disable-next-line no-restricted-imports
import { FINALIZE_OFFER_FORM_CLASS } from '../../../../view/pages/transaction/components/FinalizeOfferForm'
import { Api } from '../../../peripherals/api'
import { Wallet } from '../../../peripherals/wallet'
import { makeQuery } from '../../../utils/query'

export function initFinalizeForm() {
  const { $$ } = makeQuery(document.body)
  const forms = $$<HTMLFormElement>(`.${FINALIZE_OFFER_FORM_CLASS}`)
  forms.forEach((form) => {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      const { address, offer, offerId, perpetualAddress, collateralAsset } =
        getFormData(form)

      const hash = await Wallet.sendPerpetualForcedTradeTransaction(
        address,
        offer,
        perpetualAddress,
        collateralAsset
      )
      await Api.submitPerpetualForcedTrade(offerId, hash)
      window.location.href = `/transactions/${hash.toString()}`
    })
  })
}

function getFormData(form: HTMLFormElement) {
  const { address, offer, offerId, perpetualAddress, collateralAsset } =
    form.dataset

  if (!address || !offer || !offerId || !perpetualAddress || !collateralAsset) {
    throw new Error('Invalid data')
  }

  return {
    address: EthereumAddress(address),
    offer: deserializeFinalizeOfferData(offer),
    offerId: Number(offerId),
    perpetualAddress: EthereumAddress(perpetualAddress),
    collateralAsset: deserializeCollateralAsset(collateralAsset),
  }
}
