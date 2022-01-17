import { expect } from 'earljs'

import {
  Store,
  SyncStatusRepository,
} from '../../../src/peripherals/database/SyncStatusRepository'
import { mock } from '../../mock'

describe(SyncStatusRepository.name, () => {
  it('writes value to store', async () => {
    let key = ''
    let value = ''
    const repository = new SyncStatusRepository(
      mock<Store>({
        set: async (...args) => void ([key, value] = args),
      })
    )

    await repository.setLastBlockNumberSynced(10)

    expect(key).toEqual('lastBlockNumberSynced')
    expect(value).toEqual('10')
  })

  it('reads value from store', async () => {
    let key = ''
    const repository = new SyncStatusRepository(
      mock<Store>({
        async get(k) {
          key = k
          return '20'
        },
      })
    )

    const actual = await repository.getLastBlockNumberSynced()

    expect(actual).toEqual(20)
    expect(key).toEqual('lastBlockNumberSynced')
  })

  it('returns options.earliestBlock when store is empty', async () => {
    const store = mock<Store>({ get: async () => undefined })

    const repository = new SyncStatusRepository(store, { earliestBlock: 30 })

    const actual = await repository.getLastBlockNumberSynced()

    expect(actual).toEqual(30)
  })

  it('fallbacks to options.earliestBlock when the store is corrupt', async () => {
    const store = mock<Store>({ get: async () => '3 is my favorite number' })

    const repository = new SyncStatusRepository(store, { earliestBlock: 40 })

    const actual = await repository.getLastBlockNumberSynced()

    expect(actual).toEqual(40)
  })
})
