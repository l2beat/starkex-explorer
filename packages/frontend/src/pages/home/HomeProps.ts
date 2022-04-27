import { PedersenHash, Timestamp } from '@explorer/types'

export interface HomeProps {
  readonly account: string | undefined
  readonly stateUpdates: readonly HomeStateUpdate[]
  readonly totalUpdates: bigint
  readonly totalPositions: bigint
}

export interface HomeStateUpdate {
  readonly id: number
  readonly hash: PedersenHash
  readonly timestamp: Timestamp
  readonly positionCount: number
}

export interface HomeForcedTransaction {
  readonly hash: string // TODO: Hash256
  readonly type: 'exit' | 'trade'
  readonly timestamp: Timestamp
  readonly valueUSDCents: number
}
