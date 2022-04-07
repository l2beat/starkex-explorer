import { PedersenHash, Timestamp } from '@explorer/types'

export interface HomeProps {
  account: string | undefined
  stateUpdates: HomeStateUpdate[]
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
  hash: string // TODO: Hash256
  type: 'exit' | 'trade'
  timestamp: Timestamp
  valueUSDCents: number
}
