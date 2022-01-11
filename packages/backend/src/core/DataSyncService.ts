import { BlockRange } from '../peripherals/ethereum/types'

export class DataSyncService {
  async sync(blockRange: BlockRange) {
    console.log('sync', blockRange)
  }

  async revert() {
    throw new Error('Method not implemented.')
  }
}
