import { AssetId, PedersenHash, Timestamp } from '@explorer/types'

export interface HomeProps {
  stateUpdates: HomeStateUpdate[]
  forcedTransactions: HomeForcedTransaction[]
  totalUpdates: bigint
  totalPositions: bigint
}

export interface HomeStateUpdate {
  id: number
  hash: PedersenHash
  timestamp: Timestamp
  positionCount: number
}

export interface HomeForcedTransaction {
  type: 'exit' | 'buy' | 'sell'
  status: 'waiting to be included' | 'completed'
  hash: string
  lastUpdate: Timestamp
  amount: bigint
  assetId: AssetId
  positionId: bigint
}
