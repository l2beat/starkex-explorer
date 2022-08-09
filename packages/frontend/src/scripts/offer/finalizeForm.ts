import {
  deserializeFinalizeOfferData,
  encodeForcedTradeRequest,
  FinalizeOfferData,
  serializeFinalizeOfferBody,
} from '@explorer/shared'
import { EthereumAddress, Hash256 } from '@explorer/types'

import { FormClass } from '../../pages/offers/finalize-form/attributes'
import { getAttribute } from './getAttribute'

export function initFinalizeForm() {
  const forms = document.querySelectorAll<HTMLFormElement>(`.${FormClass}`)
  forms.forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      const address = EthereumAddress(getAttribute(form, 'address'))
      const offer = deserializeFinalizeOfferData(getAttribute(form, 'offer'))
      const offerId = Number(getAttribute(form, 'offer-id'))
      const perpetualAddress = EthereumAddress(
        getAttribute(form, 'perpetual-address')
      )
      const hash = await sendTransaction(address, perpetualAddress, offer)
      if (!hash) {
        throw new Error('Could not send a transaction')
      }
      await fetch(form.action, {
        method: form.method,
        headers: { 'Content-Type': 'application/json' },
        body: serializeFinalizeOfferBody({
          offerId,
          hash,
        }),
      })
      window.location.href = `/forced/${hash}`
    })
  })
}

async function sendTransaction(
  address: EthereumAddress,
  perpetualAddress: EthereumAddress,
  offer: FinalizeOfferData
) {
  const provider = window.ethereum
  if (!provider) {
    return
  }

  const result = await provider.request({
    method: 'eth_sendTransaction',
    params: [
      {
        from: address,
        to: perpetualAddress,
        data: encodeForcedTradeRequest(offer),
      },
    ],
  })

  return Hash256(result as string)
}
