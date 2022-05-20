import {
  digestAcceptedOfferParams,
  stringifyInitialOffer,
} from '@explorer/encoding'
import { EthereumAddress } from '@explorer/types'

import { AcceptedData, OfferData } from './types'

export async function signInitial(offer: OfferData, address: EthereumAddress) {
  const provider = window.ethereum

  if (!provider || !address) {
    return
  }

  const stringOffer = stringifyInitialOffer(offer)

  try {
    return (await provider.request({
      method: 'personal_sign',
      params: [address.toString(), stringOffer],
    })) as string
  } catch (e) {
    console.error(e)
  }
}

export async function signAccepted(
  offer: OfferData,
  accepted: AcceptedData,
  address: EthereumAddress
): Promise<string | undefined> {
  const provider = window.ethereum

  if (!provider || !address) {
    return
  }

  const digestToSign = digestAcceptedOfferParams(offer, accepted)

  try {
    return (await provider.request({
      method: 'eth_sign',
      params: [address, digestToSign],
    })) as string
  } catch (e) {
    console.error(e)
  }
}
