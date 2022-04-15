import { PedersenHash, Timestamp } from '@explorer/types'

export interface StateUpdatesIndexProps {
  readonly stateUpdates: ReadonlyArray<{
    readonly id: number
    readonly hash: PedersenHash
    readonly timestamp: Timestamp
    readonly positionCount: number
  }>
  readonly params: {
    readonly perPage: number
    readonly page: number
  }
  readonly fullCount: number
}
