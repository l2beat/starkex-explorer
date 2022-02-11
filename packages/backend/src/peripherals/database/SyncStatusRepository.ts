import type { KeyValueStore } from './KeyValueStore'

export class SyncStatusRepository {
  constructor(private readonly store: KeyValueStore<'lastBlockNumberSynced'>) {}

  async getLastSynced(): Promise<number | undefined> {
    const valueInDb = await this.store.get('lastBlockNumberSynced')
    if (valueInDb) {
      const result = Number(valueInDb)
      if (!isNaN(result)) {
        return result
      }
    }
  }

  async setLastSynced(blockNumber: number): Promise<void> {
    await this.store.set('lastBlockNumberSynced', String(blockNumber))
  }
}
