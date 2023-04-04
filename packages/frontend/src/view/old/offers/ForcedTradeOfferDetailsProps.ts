import { AssetId, EthereumAddress } from '@explorer/types'

import { AcceptOfferFormData } from '@explorer/shared'
import { AccountDetails } from '../common/AccountDetails'
import { ForcedHistoryEvent } from '../common/ForcedHistory'
import { CancelOfferFormData } from './cancel-form'
import { FinalizeOfferFormData } from './finalize-form'

export interface ForcedTradeOffer {
  readonly type: 'sell' | 'buy'
  readonly id: number
  readonly positionIdA: bigint
  readonly addressA: EthereumAddress
  readonly syntheticAmount: bigint
  readonly collateralAmount: bigint
  readonly syntheticAssetId: AssetId
  readonly positionIdB?: bigint
  readonly addressB?: EthereumAddress
}

export interface ForcedTradeOfferDetailsProps {
  readonly offer: ForcedTradeOffer
  readonly account: AccountDetails | undefined
  readonly history: ForcedHistoryEvent[]
  readonly acceptForm?: AcceptOfferFormData
  readonly cancelForm?: CancelOfferFormData
  readonly finalizeForm?: FinalizeOfferFormData
}
