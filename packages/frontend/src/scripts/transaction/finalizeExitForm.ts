import { encodeFinalizeExitRequest } from '@explorer/shared'
import { EthereumAddress, Hash256, StarkKey } from '@explorer/types'

import { FormClass } from '../../pages/forced-transactions/finalize-form'
import { getAttribute } from '../offer/getAttribute'

export function initFinalizeExitForm() {
  const forms = document.querySelectorAll<HTMLFormElement>(`.${FormClass}`)
  forms.forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      const exitHash = Hash256(getAttribute(form, 'transaction-hash'))
      const address = EthereumAddress(getAttribute(form, 'address'))
      const perpetualAddress = EthereumAddress(
        getAttribute(form, 'perpetual-address')
      )
      const starkKey = StarkKey(getAttribute(form, 'stark-key'))
      const finalizeHash = await sendTransaction(
        address,
        perpetualAddress,
        starkKey
      )
      if (!finalizeHash) {
        throw new Error('Could not send a transaction')
      }
      await fetch(form.action, {
        method: form.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exitHash,
          finalizeHash,
        }),
      })

      window.location.reload()
    })
  })
}

async function sendTransaction(
  address: EthereumAddress,
  perpetualAddress: EthereumAddress,
  starkKey: StarkKey
) {
  const provider = window.ethereum
  if (!provider) {
    return
  }

  const data = encodeFinalizeExitRequest(starkKey)

  const result = await provider.request({
    method: 'eth_sendTransaction',
    params: [
      {
        from: address,
        to: perpetualAddress,
        data,
      },
    ],
  })
  return Hash256(result as string)
}
