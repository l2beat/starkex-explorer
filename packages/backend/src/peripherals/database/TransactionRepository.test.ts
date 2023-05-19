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
        thirdPartyId: 1,
        transactionId: 1234,
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
        id,
        thirdPartyId: record.thirdPartyId,
        transactionId: record.transactionId,
        starkKeyA: record.data.starkKey,
        starkKeyB: undefined,
        type: record.data.type,
        data: record.data,
        replacedBy: undefined,
        replacementFor: undefined,
      })
    })

    it('can add a alternative transaction', async () => {
      const record = {
        thirdPartyId: 1,
        transactionId: 1234,
        data: {
          type: 'Deposit',
          starkKey: StarkKey.fake(),
          positionId: 1234n,
          amount: 5000n,
        },
      } as const
      const alternativeRecord = {
        thirdPartyId: 2,
        transactionId: 1234,
        data: {
          type: 'Deposit',
          starkKey: StarkKey.fake(),
          positionId: 1234n,
          amount: 4500n,
        },
      } as const

      const id = await repository.add(record)
      const altId = await repository.add(alternativeRecord)

      const transaction = await repository.findById(id)
      const altTransaction = await repository.findById(altId)

      expect(transaction).toEqual({
        id,
        thirdPartyId: record.thirdPartyId,
        transactionId: record.transactionId,
        starkKeyA: record.data.starkKey,
        starkKeyB: undefined,
        type: record.data.type,
        data: record.data,
        replacedBy: altTransaction?.thirdPartyId,
        replacementFor: undefined,
      })
      expect(altTransaction).toEqual({
        id: altId,
        thirdPartyId: alternativeRecord.thirdPartyId,
        transactionId: alternativeRecord.transactionId,
        starkKeyA: alternativeRecord.data.starkKey,
        starkKeyB: undefined,
        type: alternativeRecord.data.type,
        data: alternativeRecord.data,
        replacedBy: undefined,
        replacementFor: transaction?.thirdPartyId,
      })
    })
  })
})
