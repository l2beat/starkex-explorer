import { BlockRange } from '../model'
import { BlockNumber } from '../peripherals/ethereum/types'

export interface IDataSyncService {
  sync(blockRange: BlockRange): Promise<void>
  discardAfter(blockNumber: BlockNumber): Promise<void>
}
