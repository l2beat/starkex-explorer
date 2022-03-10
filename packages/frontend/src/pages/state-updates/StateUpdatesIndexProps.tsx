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
  id: number
  hash: PedersenHash
  timestamp: number
  positionCount: number
}
