import { PedersenHash, Timestamp } from '@explorer/types'

import { AccountDetails } from '../common/AccountDetails'

export interface StateUpdatesIndexProps {
  readonly account: AccountDetails | undefined
  readonly stateUpdates: readonly StateUpdateEntry[]
  readonly params: {
    readonly perPage: number
    readonly page: number
  }
  readonly total: number
}

export interface StateUpdateEntry {
  readonly id: number
  readonly hash: PedersenHash
  readonly timestamp: Timestamp
  readonly positionCount: number
  readonly forcedTxsCount: number
}
