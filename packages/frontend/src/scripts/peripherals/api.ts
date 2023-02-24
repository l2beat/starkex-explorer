import {
  AcceptedData,
  CreateOfferData,
  serializeAcceptOfferBody,
  serializeCancelOfferBody,
  serializeCreateOfferBody,
  serializeFinalizeOfferBody,
} from '@explorer/shared'
import { Hash256 } from '@explorer/types'

export async function getDydxTvl() {
  const res = await fetch('https://api.l2beat.com/api/dydx')
  const tvl = Number(await res.json())
  return Number.isNaN(tvl) ? undefined : tvl
}

export async function submitPerpetualForcedWithdrawal(hash: Hash256) {
  await fetch('/forced/exits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hash }),
  })
}

export async function submitForcedTrade(offerId: number, hash: Hash256) {
  await fetch('/forced/trades', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: serializeFinalizeOfferBody({ offerId, hash }),
  })
}

export async function createOffer(offer: CreateOfferData, signature: string) {
  const res = await fetch('/forced/offers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: serializeCreateOfferBody({ offer, signature }),
  })
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const data = await res.json()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  return data.id as number
}

export async function acceptOffer(
  offerId: number,
  accepted: AcceptedData,
  signature: string
) {
  await fetch(`/forced/offers/${offerId}/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: serializeAcceptOfferBody({ ...accepted, signature }),
  })
}

export async function cancelOffer(offerId: number, signature: string) {
  await fetch(`/forced/offers/${offerId}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: serializeCancelOfferBody({ signature }),
  })
}
