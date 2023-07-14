import { Knex } from 'knex'

import { Logger } from '../../tools/Logger'
import type { KeyValueStore } from './KeyValueStore'

export class SyncStatusRepository {
  constructor(
    private readonly store: KeyValueStore,
    private readonly logger: Logger
  ) {
    this.logger = this.logger.for(this)
  }

  async getLastSynced(trx?: Knex.Transaction): Promise<number | undefined> {
    return await this.store.findByKey('lastBlockNumberSynced', trx)
  }

  async setLastSynced(blockNumber: number): Promise<void> {
    await this.store.addOrUpdate({
      key: 'lastBlockNumberSynced',
      value: blockNumber,
    })
    this.logger.info({ method: this.setLastSynced.name, blockNumber })
  }
}
