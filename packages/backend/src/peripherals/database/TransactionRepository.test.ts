import { StarkKey } from '@explorer/types'
import { expect } from 'earl'
import { it } from 'mocha'

import { setupDatabaseTestSuite } from '../../test/database'
import { Logger } from '../../tools/Logger'
import { TransactionRepository } from './TransactionRepository'

describe(TransactionRepository.name, () => {
  const { database } = setupDatabaseTestSuite()

  const repository = new TransactionRepository(database, Logger.SILENT)

  afterEach(() => repository.deleteAll())

  describe(`${TransactionRepository.prototype.add.name} and ${TransactionRepository.prototype.findById.name}`, () => {
    it('can add a transaction', async () => {
      const record = {
        stateUpdateId: 1,
        transactionId: 1234,
        blockNumber: 12345,
        data: {
          type: 'Deposit',
          starkKey: StarkKey.fake(),
          positionId: 1234n,
          amount: 5000n,
        },
      } as const
      const id = await repository.add(record)

      const transaction = await repository.findById(id)

      expect(transaction).toEqual({
        stateUpdateId: record.stateUpdateId,
        transactionId: record.transactionId,
        blockNumber: record.blockNumber,
        starkKeyA: record.data.starkKey,
        starkKeyB: undefined,
        type: record.data.type,
        data: record.data,
        replacedBy: undefined,
        replacementFor: undefined,
      })
    })
  })
})
