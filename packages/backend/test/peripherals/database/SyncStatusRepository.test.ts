import { expect } from 'chai'

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

    expect(key).to.eq('lastBlockNumberSynced')
    expect(value).to.eq('10')
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

    expect(actual).to.eq(20)
    expect(key).to.eq('lastBlockNumberSynced')
  })

  it('returns options.earliestBlock when store is empty', async () => {
    const store = mock<Store>({ get: async () => undefined })

    const repository = new SyncStatusRepository(store, { earliestBlock: 30 })

    const actual = await repository.getLastBlockNumberSynced()

    expect(actual).to.eq(30)
  })
})
