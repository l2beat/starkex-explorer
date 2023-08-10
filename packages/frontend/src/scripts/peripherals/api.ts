import {
  AcceptedData,
  CreateOfferData,
  serializeAcceptOfferBody,
  serializeCancelOfferBody,
  serializeCreateOfferBody,
  serializeFinalizeOfferBody,
} from '@explorer/shared'
import { Hash256, StarkKey } from '@explorer/types'

export const Api = {
  async getDydxTvl() {
    const res = await fetch('https://api.l2beat.com/api/dydx')
    const tvl = Number(await res.json())
    return Number.isNaN(tvl) ? undefined : tvl
  },

  async submitPerpetualForcedWithdrawal(hash: Hash256) {
    await fetch('/forced/exits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hash }),
    })
  },

  async submitSpotForcedWithdrawal(hash: Hash256) {
    await fetch('/forced/exits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hash }),
    })
  },

  async submitPerpetualForcedTrade(offerId: number, hash: Hash256) {
    await fetch('/forced/trades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: serializeFinalizeOfferBody({ offerId, hash }),
    })
  },

  async submitOldWithdrawal(hash: Hash256) {
    await fetch('/forced/exits/finalize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exitHash: Hash256.fake(),
        finalizeHash: hash,
      }),
    })
  },

  async submitWithdrawal(hash: Hash256) {
    await fetch('/withdrawal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hash }),
    })
  },

  async submitWithdrawalWithTokenId(hash: Hash256) {
    await fetch('/withdrawal-with-token-id', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hash }),
    })
  },

  async submitForcedWithdrawalFreezeRequest(hash: Hash256) {
    await fetch('/escape/forced-withdrawal-freeze-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hash }),
    })
  },

  async submitForcedTradeFreezeRequest(hash: Hash256) {
    await fetch('/escape/forced-trade-freeze-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hash }),
    })
  },

  async submitFullWithdrawalFreezeRequest(hash: Hash256) {
    await fetch('/escape/full-withdrawal-freeze-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hash }),
    })
  },

  async submitVerifyEscape(
    hash: Hash256,
    starkKey: StarkKey,
    positionOrVaultId: string
  ) {
    await fetch('/escape/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hash, starkKey, positionOrVaultId }),
    })
  },

  async submitPerpetualFinalizeEscape(hash: Hash256) {
    await fetch('/escape/perpetual-finalize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hash }),
    })
  },

  async submitSpotFinalizeEscape(hash: Hash256) {
    await fetch('/escape/spot-finalize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hash }),
    })
  },

  async createOffer(offer: CreateOfferData, signature: string) {
    const res = await fetch('/forced/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: serializeCreateOfferBody({ offer, signature }),
    })
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const data = await res.json()
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return data.id as number
  },

  async acceptOffer(
    offerId: number,
    accepted: AcceptedData,
    signature: string
  ) {
    await fetch(`/forced/offers/${offerId}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: serializeAcceptOfferBody({ ...accepted, signature }),
    })
  },

  async cancelOffer(offerId: number, signature: string) {
    await fetch(`/forced/offers/${offerId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: serializeCancelOfferBody({ signature }),
    })
  },
}
