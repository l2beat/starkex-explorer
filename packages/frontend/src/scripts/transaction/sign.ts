import { EthereumAddress } from '@explorer/types'

import { ForcedTradeInitialOfferEntry } from './types'

export async function initSign(
  offer: ForcedTradeInitialOfferEntry,
  address: EthereumAddress
) {
  const provider = window.ethereum

  if (!provider || !address) {
    return
  }

  const stringOffer = JSON.stringify(offer, null, 2)

  const signature = (await provider.request({
    method: 'personal_sign',
    params: [address.toString(), stringOffer],
  })) as string

  return signature
}
