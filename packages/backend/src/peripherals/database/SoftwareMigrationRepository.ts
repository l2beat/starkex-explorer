import { Logger } from '../../tools/Logger'
import type { KeyValueStore } from './KeyValueStore'

export class SoftwareMigrationRepository {
  constructor(
    private readonly store: KeyValueStore,
    private readonly logger: Logger
  ) {
    this.logger = this.logger.for(this)
  }

  async getMigrationNumber(): Promise<number> {
    const valueInDb = await this.store.findByKey('softwareMigrationNumber')
    return valueInDb ?? 0
  }

  async setMigrationNumber(number: number): Promise<void> {
    await this.store.addOrUpdate({
      key: 'softwareMigrationNumber',
      value: number,
    })
    this.logger.debug({ method: this.setMigrationNumber.name, number })
  }
}
