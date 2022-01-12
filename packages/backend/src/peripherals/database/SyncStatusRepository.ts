import type { KeyValueStore } from './KeyValueStore'

/** block of the first verifier deploy */
const EARLIEST_BLOCK = 11813207

export type Store = Pick<KeyValueStore<'lastBlockNumberSynced'>, 'get' | 'set'>

export class SyncStatusRepository {
  private readonly earliestBlock: number

  constructor(
    private readonly store: Store,
    options: { earliestBlock?: number } = {}
  ) {
    this.earliestBlock = options.earliestBlock || EARLIEST_BLOCK
  }

  async getLastBlockNumberSynced(): Promise<number> {
    const valueInDb = await this.store.get('lastBlockNumberSynced')

    return (valueInDb && Number(valueInDb)) || this.earliestBlock
  }

  async setLastBlockNumberSynced(blockNumber: number): Promise<void> {
    await this.store.set('lastBlockNumberSynced', String(blockNumber))
  }
}
