import { AssetId, EthereumAddress } from '@explorer/types'

import { AccountDetails } from '../common/AccountDetails'
import { ForcedHistoryEvent } from '../common/ForcedHistory'
import { AcceptOfferFormData } from './accept-form'
import { CancelOfferFormData } from './cancel-form'

export type ForcedTradeOffer = {
  readonly type: 'sell' | 'buy'
  readonly id: number
  readonly positionIdA: bigint
  readonly addressA: EthereumAddress
  readonly amountSynthetic: bigint
  readonly amountCollateral: bigint
  readonly syntheticAssetId: AssetId
  readonly positionIdB?: bigint
  readonly addressB?: EthereumAddress
}

export type ForcedTradeOfferDetailsProps = {
  readonly offer: ForcedTradeOffer
  readonly account: AccountDetails | undefined
  readonly history: ForcedHistoryEvent[]
  readonly acceptForm?: AcceptOfferFormData
  readonly cancelForm?: CancelOfferFormData
}
