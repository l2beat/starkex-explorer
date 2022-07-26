import { encodeFinalizeExitRequest } from '@explorer/shared'
import { EthereumAddress, Hash256 } from '@explorer/types'

import { FormClass } from '../../pages/forced-transactions/finalize-form'
import { getAttribute } from '../offer/getAttribute'

export async function initFinalizeExitForm() {
  const forms = document.querySelectorAll<HTMLFormElement>(`.${FormClass}`)
  forms.forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      const exitHash = Hash256(getAttribute(form, 'transaction-hash'))
      const address = EthereumAddress(getAttribute(form, 'address'))
      const perpetualAddress = EthereumAddress(
        getAttribute(form, 'perpetual-address')
      )
      const amount = BigInt(getAttribute(form, 'amount'))
      const finalizeHash = await sendTransaction(
        address,
        perpetualAddress,
        amount
      )
      if (!finalizeHash) {
        throw new Error('Could not send a transaction')
      }
      await fetch(`/forced/exits/finalize`, {
        method: 'POST',
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
  amount: bigint
) {
  const provider = window.ethereum
  if (!provider) {
    return
  }

  const { eth, wei } = splitEthWei(amount)

  const data = encodeFinalizeExitRequest(eth, wei)

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

function splitEthWei(amount: bigint) {
  const wei = amount % 10n ** 18n
  const eth = (amount - wei) / 10n ** 18n
  return { eth, wei }
}
