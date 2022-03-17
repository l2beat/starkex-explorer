import { PedersenHash } from '@explorer/types'

export interface HomeProps {
  stateUpdates: HomeStateUpdate[]
  totalUpdates: bigint
  totalPositions: bigint
}

export interface HomeStateUpdate {
  id: number
  hash: PedersenHash
  timestamp: number
  positionCount: number
}

export interface HomeForcedTransaction {
  hash: string // TODO: Hash256
  type: 'exit' | 'trade'
  timestamp: number
  valueUSDCents: number
}
