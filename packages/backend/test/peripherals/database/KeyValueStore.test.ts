import { expect } from 'earljs'

import { KeyValueStore } from '../../../src/peripherals/database/KeyValueStore'
import { Logger } from '../../../src/tools/Logger'
import { setupDatabaseTestSuite } from './setup'

describe(KeyValueStore.name, () => {
  const { knex } = setupDatabaseTestSuite()
  const kvStore = new KeyValueStore(knex, Logger.SILENT)

  afterEach(() => kvStore.deleteAll())

  it('sets and reads value', async () => {
    kvStore.addOrUpdate({ key: 'key', value: 'value' })
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
    expect(actual).toBeAnArrayOfLength(3)
    expect(actual).toBeAnArrayWith(
      { key: '1', value: 'one' },
      { key: '2', value: 'two' },
      { key: '3', value: 'three' }
    )

    await kvStore.deleteAll()
    actual = await kvStore.getAll()
    expect(actual).toEqual([])
  })
})
