import { UserDetails } from '@explorer/shared'
import { EthereumAddress, Timestamp } from '@explorer/types'

import { Asset } from '../../../utils/assets'

export interface WithdrawalPageProps {
  user: UserDetails | undefined
  ethereumAddress: EthereumAddress
  status: 'SENT (1/2)' | 'MINED (2/2)' | 'REVERTED'
  amount: bigint
  asset: Asset
  history: HistoryItem[]
}

export interface HistoryItem {
  timestamp: Timestamp
  status: 'SENT (1/2)' | 'MINED (2/2)' | 'REVERTED'
  description: string
}
