import { expect, mockObject } from 'earl'

import { Logger } from '../../tools/Logger'
import { KeyValueStore } from './KeyValueStore'
import { SyncStatusRepository } from './SyncStatusRepository'

describe(SyncStatusRepository.name, () => {
  it('writes value to store', async () => {
    const store = mockObject<KeyValueStore>({
      addOrUpdate: async () => 'lastBlockNumberSynced',
    })
    const repository = new SyncStatusRepository(store, Logger.SILENT)

    await repository.setLastSynced(20)
    expect(store.addOrUpdate).toHaveBeenOnlyCalledWith({
      key: 'lastBlockNumberSynced',
      value: '20',
    })
  })

  it('reads value from store', async () => {
    const store = mockObject<KeyValueStore>({
      findByKey: async () => '20',
    })
    const repository = new SyncStatusRepository(store, Logger.SILENT)

    const actual = await repository.getLastSynced()
    expect(actual).toEqual(20)
    expect(store.findByKey).toHaveBeenOnlyCalledWith(
      'lastBlockNumberSynced',
      undefined
    )
  })

  it('returns undefined when store is empty', async () => {
    const store = mockObject<KeyValueStore>({
      findByKey: async () => undefined,
    })
    const repository = new SyncStatusRepository(store, Logger.SILENT)

    const actual = await repository.getLastSynced()
    expect(actual).toEqual(undefined)
  })

  it('returns undefined when the store is corrupt', async () => {
    const store = mockObject<KeyValueStore>({
      findByKey: async () => '3 is my favorite number',
    })
    const repository = new SyncStatusRepository(store, Logger.SILENT)

    const actual = await repository.getLastSynced()
    expect(actual).toEqual(undefined)
  })
})
