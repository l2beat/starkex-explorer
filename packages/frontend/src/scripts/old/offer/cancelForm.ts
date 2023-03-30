import { EthereumAddress } from '@explorer/types'

// eslint-disable-next-line no-restricted-imports
import { FormClass } from '../../../view/old/offers/cancel-form/attributes'
import { Api } from '../../peripherals/api'
import { Wallet } from '../../peripherals/wallet'
import { getAttribute } from './getAttribute'

export function initCancelOfferForm() {
  const forms = document.querySelectorAll<HTMLFormElement>(`.${FormClass}`)
  forms.forEach((form) => {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      const offerId = Number(getAttribute(form, 'offer-id'))
      const address = EthereumAddress(getAttribute(form, 'address'))
      const signature = await Wallet.signCancel(address, offerId)
      await Api.cancelOffer(offerId, signature)
      window.location.href = `/forced/offers/${offerId.toString()}`
    })
  })
}
