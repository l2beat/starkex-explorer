import { EthereumAddress } from '@explorer/types'

import { CANCEL_OFFER_FORM_ID } from '../../view/pages/transaction/components/CancelOfferForm'
import { Api } from '../peripherals/api'
import { Wallet } from '../peripherals/wallet'

export function initCancelOfferForm() {
  const forms = document.querySelectorAll<HTMLFormElement>(
    `.${CANCEL_OFFER_FORM_ID}`
  )
  forms.forEach((form) => {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      const { address, offerId } = getFormData(form)

      const signature = await Wallet.signCancel(address, offerId)
      await Api.cancelOffer(offerId, signature)
      window.location.href = `/forced/offers/${offerId.toString()}`
    })
  })
}

function getFormData(form: HTMLFormElement) {
  const { address, offerId } = form.dataset

  if (!address || !offerId) {
    throw new Error('Invalid data')
  }

  return {
    address: EthereumAddress(address),
    offerId: Number(offerId),
  }
}
