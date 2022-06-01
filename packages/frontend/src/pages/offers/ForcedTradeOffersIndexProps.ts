import { AssetId, Timestamp } from '@explorer/types'

import { AccountDetails } from '../common/AccountDetails'

export type OfferType = 'buy' | 'sell'

export interface ForcedTradeOfferEntry {
  readonly id: number
  readonly createdAt: Timestamp
  readonly type: OfferType
  readonly assetId: AssetId
  readonly price: bigint
  readonly amount: bigint
  readonly total: bigint
  readonly positionId: bigint
}

export interface ForcedTradeOffersIndexProps {
  readonly account: AccountDetails | undefined
  readonly offers: ForcedTradeOfferEntry[]
  readonly assetIds: AssetId[]
  readonly params: {
    readonly perPage: number
    readonly page: number
    readonly assetId?: AssetId
    readonly type?: OfferType
  }
  readonly total: number
}
