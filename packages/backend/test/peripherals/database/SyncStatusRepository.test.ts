import { expect } from 'earljs'

import { KeyValueStore } from '../../../src/peripherals/database/KeyValueStore'
import { SyncStatusRepository } from '../../../src/peripherals/database/SyncStatusRepository'
import { mock } from '../../mock'

describe(SyncStatusRepository.name, () => {
  it('writes value to store', async () => {
    const store = mock<KeyValueStore<'lastBlockNumberSynced'>>({
      set: async () => {},
    })
    const repository = new SyncStatusRepository(store)

    await repository.setLastSynced(20)
    expect(store.set).toHaveBeenCalledWith(['lastBlockNumberSynced', '20'])
  })

  it('reads value from store', async () => {
    const store = mock<KeyValueStore<'lastBlockNumberSynced'>>({
      get: async () => '20',
    })
    const repository = new SyncStatusRepository(store)

    const actual = await repository.getLastSynced()
    expect(actual).toEqual(20)
    expect(store.get).toHaveBeenCalledWith(['lastBlockNumberSynced'])
  })

  it('returns undefined when store is empty', async () => {
    const store = mock<KeyValueStore<'lastBlockNumberSynced'>>({
      get: async () => undefined,
    })
    const repository = new SyncStatusRepository(store)

    const actual = await repository.getLastSynced()
    expect(actual).toEqual(undefined)
  })

  it('returns undefined when the store is corrupt', async () => {
    const store = mock<KeyValueStore<'lastBlockNumberSynced'>>({
      get: async () => '3 is my favorite number',
    })
    const repository = new SyncStatusRepository(store)

    const actual = await repository.getLastSynced()
    expect(actual).toEqual(undefined)
  })
})
