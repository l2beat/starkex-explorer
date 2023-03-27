import { expect } from 'earljs'

import { setupDatabaseTestSuite } from '../../test/database'
import { Logger } from '../../tools/Logger'
import { KeyValueStore } from './KeyValueStore'

describe(KeyValueStore.name, () => {
  const { database } = setupDatabaseTestSuite()
  const kvStore = new KeyValueStore(database, Logger.SILENT)

  afterEach(() => kvStore.deleteAll())

  it('sets and reads value', async () => {
    await kvStore.addOrUpdate({ key: 'key', value: 'value' })
    const actual = await kvStore.findByKey('key')
    expect(actual).toEqual('value')
    await kvStore.deleteByKey('key')
  })

  it('reads and removes all values', async () => {
    await Promise.all([
      kvStore.addOrUpdate({ key: '1', value: 'one' }),
      kvStore.addOrUpdate({ key: '2', value: 'two' }),
      kvStore.addOrUpdate({ key: '3', value: 'three' }),
    ])

    let actual = await kvStore.getAll()
    expect(actual).toEqualUnsorted([
      { key: '1', value: 'one' },
      { key: '2', value: 'two' },
      { key: '3', value: 'three' },
    ])

    await kvStore.deleteAll()
    actual = await kvStore.getAll()
    expect(actual).toEqual([])
  })
})
