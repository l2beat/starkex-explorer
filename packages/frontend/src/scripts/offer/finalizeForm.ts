import { deserializeFinalizeOfferData } from '@explorer/shared'
import { EthereumAddress } from '@explorer/types'

// eslint-disable-next-line no-restricted-imports
import { FINALIZE_OFFER_FORM_ID } from '../../view/pages/transaction/components/FinalizeOfferForm'
import { Api } from '../peripherals/api'
import { Wallet } from '../peripherals/wallet'

export function initFinalizeForm() {
  const forms = document.querySelectorAll<HTMLFormElement>(
    `.${FINALIZE_OFFER_FORM_ID}`
  )
  forms.forEach((form) => {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      const { address, offer, offerId, perpetualAddress } = getFormData(form)

      const hash = await Wallet.sendPerpetualForcedTradeTransaction(
        address,
        offer,
        perpetualAddress
      )
      await Api.submitPerpetualForcedTrade(offerId, hash)
      window.location.href = `/forced/${hash.toString()}`
    })
  })
}

function getFormData(form: HTMLFormElement) {
  const { address, offer, offerId, perpetualAddress } = form.dataset

  if (!address || !offer || !offerId || !perpetualAddress) {
    throw new Error('Invalid data')
  }

  return {
    address: EthereumAddress(address),
    offer: deserializeFinalizeOfferData(offer),
    offerId: Number(offerId),
    perpetualAddress: EthereumAddress(perpetualAddress),
  }
}
