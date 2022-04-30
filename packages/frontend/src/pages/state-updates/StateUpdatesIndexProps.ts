import { EthereumAddress, PedersenHash, Timestamp } from '@explorer/types'

export interface StateUpdatesIndexProps {
  readonly account: EthereumAddress | undefined
  readonly stateUpdates: readonly StateUpdateEntry[]
  readonly params: {
    readonly perPage: number
    readonly page: number
  }
  readonly fullCount: number
}

export interface StateUpdateEntry {
  readonly id: number
  readonly hash: PedersenHash
  readonly timestamp: Timestamp
  readonly positionCount: number
}
