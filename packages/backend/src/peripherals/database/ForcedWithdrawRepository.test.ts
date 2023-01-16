import { Hash256, StarkKey, Timestamp } from '@explorer/types'
import { expect } from 'earljs'

import { setupDatabaseTestSuite } from '../../test/database'
import { Logger } from '../../tools/Logger'
import {
  ForcedWithdrawRepository,
  ForcedWithdrawTransactionRecord,
} from './ForcedWithdrawRepository'

describe(ForcedWithdrawRepository.name, () => {
  const { database } = setupDatabaseTestSuite()
  const repository = new ForcedWithdrawRepository(database, Logger.SILENT)

  afterEach(() => repository.deleteAll())

  it('adds single record and queries it', async () => {
    const record: ForcedWithdrawTransactionRecord = {
      hash: Hash256.fake(),
      starkKey: StarkKey.fake(),
      amount: 1n,
      positionId: 2n,
    }
    await repository.addSent({ ...record, sentAt: Timestamp.now() })
    const result = await repository.findByTransactionHash(record.hash)
    expect(result).toEqual(record)
  })
})
