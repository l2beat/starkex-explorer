import { Logger } from '../../tools/Logger'
import type { KeyValueStore } from './KeyValueStore'

export class SyncStatusRepository {
  constructor(
    private readonly store: KeyValueStore,
    private readonly logger: Logger
  ) {}

  async getLastSynced(): Promise<number | undefined> {
    const valueInDb = await this.store.findByKey('lastBlockNumberSynced')
    if (valueInDb) {
      const result = Number(valueInDb)
      if (!isNaN(result)) {
        return result
      }
    }
  }

  async setLastSynced(blockNumber: number): Promise<void> {
    await this.store.addOrUpdate({
      key: 'lastBlockNumberSynced',
      value: String(blockNumber),
    })
    this.logger.info({ method: this.setLastSynced.name, blockNumber })
  }
}
