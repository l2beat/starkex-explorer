import {
  deserializeAcceptedData,
  deserializeCollateralAsset,
  deserializeCreateOfferData,
} from '@explorer/shared'
import { EthereumAddress } from '@explorer/types'

import { ACCEPT_OFFER_FORM_ID } from '../../../../view/pages/transaction/components/AcceptOfferForm'
import { Api } from '../../../peripherals/api'
import { Wallet } from '../../../peripherals/wallet'

export function initAcceptOfferForm() {
  const forms = document.querySelectorAll<HTMLFormElement>(
    `.${ACCEPT_OFFER_FORM_ID}`
  )
  forms.forEach((form) => {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      const { address, offer, offerId, accepted, collateralAsset } =
        getFormData(form)

      const signature = await Wallet.signOfferAccept(
        address,
        offer,
        accepted,
        collateralAsset
      )
      await Api.acceptOffer(offerId, accepted, signature)
      window.location.reload()
    })
  })
}

function getFormData(form: HTMLFormElement) {
  const { address, offer, offerId, accepted, collateralAsset } = form.dataset

  if (!address || !offer || !offerId || !accepted || !collateralAsset) {
    throw new Error('Invalid data')
  }

  return {
    address: EthereumAddress(address),
    offer: deserializeCreateOfferData(offer),
    offerId: Number(offerId),
    accepted: deserializeAcceptedData(accepted),
    collateralAsset: deserializeCollateralAsset(collateralAsset),
  }
}
