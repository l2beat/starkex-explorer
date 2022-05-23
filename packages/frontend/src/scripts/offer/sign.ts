import {
  digestAcceptedOfferParams,
  getCancelRequest,
  stringifyInitialOffer,
} from '@explorer/shared'
import { EthereumAddress } from '@explorer/types'

import { AcceptedData, OfferData } from './types'

async function sign(
  method: 'personal_sign' | 'eth_sign',
  address: EthereumAddress,
  toSign: string
) {
  const provider = window.ethereum
  if (!provider) return
  try {
    return (await provider.request({
      method,
      params: [address.toString(), toSign],
    })) as string
  } catch (e) {
    console.error(e)
  }
}

export async function signInitial(
  offer: OfferData,
  address: EthereumAddress
): Promise<string | undefined> {
  const toSign = stringifyInitialOffer(offer)
  return sign('personal_sign', address, toSign)
}

export async function signAccepted(
  offer: OfferData,
  accepted: AcceptedData,
  address: EthereumAddress
): Promise<string | undefined> {
  const toSign = digestAcceptedOfferParams(offer, accepted)
  return sign('personal_sign', address, toSign)
}

export async function signCancel(
  offerId: number,
  address: EthereumAddress
): Promise<string | undefined> {
  const toSign = getCancelRequest(offerId)
  return sign('personal_sign', address, toSign)
}
