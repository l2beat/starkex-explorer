import { EthereumAddress, PedersenHash, Timestamp } from '@explorer/types'

export interface StateUpdatesIndexProps {
  readonly account: EthereumAddress | undefined
  readonly stateUpdates: readonly StateUpdate[]
  readonly params: {
    readonly perPage: number
    readonly page: number
  }
  readonly fullCount: number
}

export interface StateUpdate {
  readonly id: number
  readonly hash: PedersenHash
  readonly timestamp: Timestamp
  readonly positionCount: number
}
