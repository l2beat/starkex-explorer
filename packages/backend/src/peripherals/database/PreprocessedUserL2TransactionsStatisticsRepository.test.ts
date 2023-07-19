import { Hash256, StarkKey } from '@explorer/types'
import { expect } from 'earl'
import { Knex } from 'knex'

import { setupDatabaseTestSuite } from '../../test/database'
import { fakePreprocessedL2TransactionsStatistics } from '../../test/fakes'
import { Logger, LogLevel } from '../../tools/Logger'
import { PreprocessedStateUpdateRepository } from './PreprocessedStateUpdateRepository'
import { PreprocessedUserL2TransactionsStatisticsRepository } from './PreprocessedUserL2TransactionsStatisticsRepository'

const mockRecord = {
  stateUpdateId: 1900,
  starkKey: StarkKey.fake(),
  l2TransactionsStatistics: fakePreprocessedL2TransactionsStatistics(),
  cumulativeL2TransactionsStatistics:
    fakePreprocessedL2TransactionsStatistics(),
}

describe(PreprocessedUserL2TransactionsStatisticsRepository.name, () => {
  const { database } = setupDatabaseTestSuite()
  let trx: Knex.Transaction

  const repository = new PreprocessedUserL2TransactionsStatisticsRepository(
    database,
    new Logger({ format: 'pretty', logLevel: LogLevel.ERROR })
  )

  const preprocessedStateUpdateRepository =
    new PreprocessedStateUpdateRepository(database, Logger.SILENT)

  beforeEach(async () => {
    const knex = await database.getKnex()
    trx = await knex.transaction()
    // adding records to preprocessed_asset_history table
    // to satisfy foreign key constraint of state_update_id
    await preprocessedStateUpdateRepository.deleteAll(trx)
    await preprocessedStateUpdateRepository.add(
      {
        stateUpdateId: 100,
        stateTransitionHash: Hash256.fake('12000'),
      },
      trx
    )
    await preprocessedStateUpdateRepository.add(
      {
        stateUpdateId: 200,
        stateTransitionHash: Hash256.fake('13000'),
      },
      trx
    ),
      await preprocessedStateUpdateRepository.add(
        {
          stateUpdateId: 1900,
          stateTransitionHash: Hash256.fake('19000'),
        },
        trx
      )
    await repository.deleteAll(trx)
  })

  afterEach(async () => {
    await trx.rollback()
  })

  describe(`${PreprocessedUserL2TransactionsStatisticsRepository.prototype.add.name}, ${PreprocessedUserL2TransactionsStatisticsRepository.prototype.findLast.name}, ${PreprocessedUserL2TransactionsStatisticsRepository.prototype.findCurrentByStarkKey.name}`, () => {
    it('adds, finds current by stark key and finds last ', async () => {
      const id = await repository.add(mockRecord, trx)

      const current = await repository.findCurrentByStarkKey(
        mockRecord.starkKey,
        trx
      )
      const last = await repository.findLast(trx)

      const expectedRecord = {
        id,
        ...mockRecord,
      }
      expect(current).toEqual(expectedRecord)
      expect(last).toEqual(expectedRecord)
    })
  })

  describe(
    PreprocessedUserL2TransactionsStatisticsRepository.prototype
      .deleteByStateUpdateId.name,
    () => {
      it('removes by state update id', async () => {
        const starkKey = StarkKey.fake('1234aa')
        for (const stateUpdateId of [100, 200, 1900]) {
          await repository.add(
            {
              ...mockRecord,
              starkKey,
              stateUpdateId,
            },
            trx
          )
        }

        await repository.deleteByStateUpdateId(1900, trx)
        expect(
          (await repository.findCurrentByStarkKey(starkKey, trx))?.stateUpdateId
        ).toEqual(200)
      })
    }
  )
})
