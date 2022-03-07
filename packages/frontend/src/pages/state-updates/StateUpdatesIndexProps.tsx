import { PedersenHash } from '@explorer/types'

export interface StateUpdatesIndexProps {
  stateUpdates: StateUpdate[]
  params: {
    perPage: number
    page: number
  }
  fullCount: number
}

export interface StateUpdate {
  hash: PedersenHash
  timestamp: number
  positionCount: number
}
