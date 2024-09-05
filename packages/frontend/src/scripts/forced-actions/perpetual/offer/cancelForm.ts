import { EthereumAddress } from '@explorer/types'

import { CANCEL_OFFER_FORM_CLASS } from '../../../../view/pages/transaction/components/CancelOfferForm'
import { Api } from '../../../peripherals/api'
import { Wallet } from '../../../peripherals/wallet'
import { makeQuery } from '../../../utils/query'
import { showSpinner } from '../../../utils/showSpinner'

export function initCancelOfferForm() {
  const { $ } = makeQuery(document.body)

  const form = $.maybe<HTMLFormElement>(`.${CANCEL_OFFER_FORM_CLASS}`)
  if (!form) {
    return
  }
  const { $: form$ } = makeQuery(form)
  const button = form$('button')

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    await showSpinner(button, async () => {
      const { address, offerId } = getFormData(form)

      const signature = await Wallet.signOfferCancel(address, offerId)
      await Api.cancelOffer(offerId, signature)
      window.location.reload()
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
