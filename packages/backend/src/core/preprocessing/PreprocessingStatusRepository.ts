import { Knex } from 'knex'

import { KeyValueStore } from '../../peripherals/database/KeyValueStore'
import { Logger } from '../../tools/Logger'

export class PreprocessingStatusRepository {
  constructor(
    private readonly store: KeyValueStore,
    private readonly logger: Logger
  ) {
    this.logger = this.logger.for(this)
  }

  async getLastPreprocessedStateUpdate(
    trx?: Knex.Transaction
  ): Promise<number> {
    const valueInDb = await this.store.findByKey(
      'lastPreprocessedStateUpdate',
      trx
    )
    if (valueInDb) {
      const result = Number(valueInDb)
      if (isNaN(result)) {
        throw new Error(
          `Invalid value in database for ${this.getLastPreprocessedStateUpdate.name}`
        )
      }
      return result
    }
    return 0
  }

  async setLastPreprocessedStateUpdate(
    stateUpdateId: number,
    trx?: Knex.Transaction
  ): Promise<void> {
    await this.store.addOrUpdate(
      {
        key: 'lastPreprocessedStateUpdate',
        value: String(stateUpdateId),
      },
      trx
    )
    this.logger.info({
      method: this.setLastPreprocessedStateUpdate.name,
      stateUpdateId,
    })
  }
}
