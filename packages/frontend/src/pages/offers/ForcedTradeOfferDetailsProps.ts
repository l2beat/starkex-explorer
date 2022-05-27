import { AssetId, EthereumAddress } from '@explorer/types'

import { ForcedHistoryEvent } from '../common/ForcedHistory'

export type ForcedTradeOffer = {
  readonly type: 'sell' | 'buy'
  readonly id: number
  readonly positionIdA: bigint
  readonly addressA: EthereumAddress
  readonly amountSynthetic: bigint
  readonly amountCollateral: bigint
  readonly assetId: AssetId
  readonly positionIdB?: bigint
  readonly addressB?: EthereumAddress
}

export type ForcedTradeOfferDetailsProps = {
  readonly offer: ForcedTradeOffer
  readonly account: EthereumAddress | undefined
  readonly history: ForcedHistoryEvent[]
}
