import { EthereumAddress } from '@explorer/types'

import { CANCEL_OFFER_FORM_CLASS } from '../../../../view/pages/transaction/components/CancelOfferForm'
import { Api } from '../../../peripherals/api'
import { Wallet } from '../../../peripherals/wallet'
import { makeQuery } from '../../../utils/query'

export function initCancelOfferForm() {
  const { $ } = makeQuery(document.body)

  const form = $.maybe<HTMLFormElement>(`.${CANCEL_OFFER_FORM_CLASS}`)
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  form?.addEventListener('submit', async (e) => {
    e.preventDefault()
    const { address, offerId } = getFormData(form)

    const signature = await Wallet.signOfferCancel(address, offerId)
    await Api.cancelOffer(offerId, signature)
    window.location.reload()
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
