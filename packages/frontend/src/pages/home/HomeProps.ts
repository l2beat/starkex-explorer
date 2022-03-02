import { PedersenHash } from '@explorer/types'

export interface HomeProps {
  stateUpdates: HomeStateUpdate[]
  forcedTransaction: HomeForcedTransaction[]
}

export interface HomeStateUpdate {
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
