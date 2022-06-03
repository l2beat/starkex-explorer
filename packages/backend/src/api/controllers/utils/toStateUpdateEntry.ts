import { StateUpdateEntry } from '@explorer/frontend'
import { PedersenHash, Timestamp } from '@explorer/types'

export function toStateUpdateEntry(stateUpdate: {
  id: number
  rootHash: PedersenHash
  timestamp: Timestamp
  positionCount: number
  forcedTransactionsCount: number
}): StateUpdateEntry {
  return {
    id: stateUpdate.id,
    hash: stateUpdate.rootHash,
    timestamp: stateUpdate.timestamp,
    positionCount: stateUpdate.positionCount,
    forcedTransactionsCount: stateUpdate.forcedTransactionsCount,
  }
}
