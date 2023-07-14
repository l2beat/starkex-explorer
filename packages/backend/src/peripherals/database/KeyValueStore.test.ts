import { expect } from 'earl'

import { setupDatabaseTestSuite } from '../../test/database'
import { Logger } from '../../tools/Logger'
import { KeyValueStore } from './KeyValueStore'

describe.only(KeyValueStore.name, () => {
  const { database } = setupDatabaseTestSuite()
  const kvStore = new KeyValueStore(database, Logger.SILENT)

  afterEach(() => kvStore.deleteAll())

  it('sets and reads value', async () => {
    await kvStore.addOrUpdate({ key: 'softwareMigrationNumber', value: 1 })
    const actual = await kvStore.findByKey('softwareMigrationNumber')
    expect(actual).toEqual(1)
    await kvStore.deleteByKey('softwareMigrationNumber')
    const actualAfterDelete = await kvStore.findByKey(
      'softwareMigrationNumber'
    )
    expect(actualAfterDelete).toEqual(undefined)
  })

  it('reads and removes all values', async () => {
    await Promise.all([
      kvStore.addOrUpdate({ key: 'softwareMigrationNumber', value: 2 }),
      kvStore.addOrUpdate({ key: 'lastBlockNumberSynced', value: 12 }),
      kvStore.addOrUpdate({
        key: 'userStatisticsPreprocessorCaughtUp',
        value: true,
      }),
    ])

    let actual = await kvStore.getAll()
    expect(actual).toEqualUnsorted([
      { key: 'softwareMigrationNumber', value: 2 },
      { key: 'lastBlockNumberSynced', value: 12 },
      { key: 'userStatisticsPreprocessorCaughtUp', value: true },
    ])

    await kvStore.deleteAll()
    actual = await kvStore.getAll()
    expect(actual).toEqual([])
  })
})
