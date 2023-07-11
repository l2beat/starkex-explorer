import { Hash256, StarkKey, Timestamp } from '@explorer/types'
import { expect } from 'earl'
import { Knex } from 'knex'

import { setupDatabaseTestSuite } from '../../test/database'
import { fakePreprocessedL2TransactionsStatistics } from '../../test/fakes'
import { Logger, LogLevel } from '../../tools/Logger'
import { PreprocessedStateUpdateRepository } from './PreprocessedStateUpdateRepository'
import { PreprocessedUserStatisticsRepository } from './PreprocessedUserStatisticsRepository'

const mockRecord = {
  stateUpdateId: 1900,
  blockNumber: 1_000_000,
  timestamp: Timestamp(900_000_000n),
  starkKey: StarkKey.fake(),
  assetCount: 20,
  balanceChangeCount: 100,
}

describe(PreprocessedUserStatisticsRepository.name, () => {
  const { database } = setupDatabaseTestSuite()
  let trx: Knex.Transaction

  const repository = new PreprocessedUserStatisticsRepository(
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

  describe(`${PreprocessedUserStatisticsRepository.prototype.add.name} and ${PreprocessedUserStatisticsRepository.prototype.update.name}`, () => {
    it('adds and updates', async () => {
      const id = await repository.add(mockRecord, trx)

      const last = await repository.findCurrentByStarkKey(
        mockRecord.starkKey,
        trx
      )

      expect(last).toEqual({
        id,
        ...mockRecord,
        prevHistoryId: undefined,
        l2TransactionsStatistics: undefined,
      })

      const l2TransactionsStatistics =
        fakePreprocessedL2TransactionsStatistics()
      const updatedRecord = {
        ...mockRecord,
        id,
        l2TransactionsStatistics,
      }

      await repository.update(updatedRecord, trx)

      const updated = await repository.findCurrentByStarkKey(
        mockRecord.starkKey,
        trx
      )

      expect(updated).toEqual({
        ...updatedRecord,
        l2TransactionsStatistics,
        prevHistoryId: undefined,
      })
    })
  })

  describe(
    PreprocessedUserStatisticsRepository.prototype.findCurrentByStarkKey.name,
    () => {
      it('returns undefined when no current (most recent) statistics record', async () => {
        const starkKey = StarkKey.fake('1234aa')
        const last = await repository.findCurrentByStarkKey(starkKey, trx)
        expect(last).toEqual(undefined)
      })

      it('finds current (most recent) statistics record by Stark Key', async () => {
        const starkKey = StarkKey.fake('1234aa')
        const otherKey = StarkKey.fake('1235bb')
        await repository.add(
          { ...mockRecord, starkKey, timestamp: Timestamp(100) },
          trx
        )
        await repository.add(
          { ...mockRecord, starkKey, timestamp: Timestamp(200) },
          trx
        )
        const mostRecent = {
          ...mockRecord,
          starkKey,
          timestamp: Timestamp(300),
        }
        const id = await repository.add(mostRecent, trx)
        await repository.add(
          { ...mockRecord, starkKey: otherKey, timestamp: Timestamp(400) },
          trx
        )

        const current = await repository.findCurrentByStarkKey(starkKey, trx)
        expect(current).toEqual({
          ...mostRecent,
          id,
          prevHistoryId: undefined,
          l2TransactionsStatistics: undefined,
        })
      })
    }
  )

  describe(
    PreprocessedUserStatisticsRepository.prototype
      .findMostRecentWithL2TransactionsStatisticsByStarkKey.name,
    async () => {
      it('returns undefined when no records found', async () => {
        await repository.add(
          {
            ...mockRecord,
            stateUpdateId: 100,
          },
          trx
        )
        const result =
          await repository.findMostRecentWithL2TransactionsStatisticsByStarkKey(
            mockRecord.starkKey,
            trx
          )

        expect(result).toEqual(undefined)
      })

      it('finds most recent with l2 transactions statistics by stark key', async () => {
        const l2TransactionsStatistics =
          fakePreprocessedL2TransactionsStatistics()
        const id = await repository.add(
          {
            ...mockRecord,
            stateUpdateId: 100,
            l2TransactionsStatistics,
          },
          trx
        )
        await repository.add({ ...mockRecord, stateUpdateId: 200 }, trx)
        await repository.add({ ...mockRecord, stateUpdateId: 1900 }, trx)

        const result =
          await repository.findMostRecentWithL2TransactionsStatisticsByStarkKey(
            mockRecord.starkKey,
            trx
          )

        expect(result).toEqual({
          ...mockRecord,
          id,
          stateUpdateId: 100,
          l2TransactionsStatistics,
          prevHistoryId: undefined,
        })
      })
    }
  )

  describe(
    PreprocessedUserStatisticsRepository.prototype
      .getAllWithoutL2TransactionStatisticsUpToStateUpdateId.name,
    () => {
      it('returns empty array when no records', async () => {
        const result =
          await repository.getAllWithoutL2TransactionStatisticsUpToStateUpdateId(
            1000,
            trx
          )

        expect(result).toEqual([])
      })

      it('returns all records without L2 transaction statistics up to state update id', async () => {
        const id1 = await repository.add(
          { ...mockRecord, stateUpdateId: 100 },
          trx
        )
        const id2 = await repository.add(
          { ...mockRecord, stateUpdateId: 200 },
          trx
        )
        await repository.add(
          {
            ...mockRecord,
            stateUpdateId: 100,
            l2TransactionsStatistics:
              fakePreprocessedL2TransactionsStatistics(),
          },
          trx
        )
        await repository.add({ ...mockRecord, stateUpdateId: 1900 }, trx)

        const results =
          await repository.getAllWithoutL2TransactionStatisticsUpToStateUpdateId(
            1899,
            trx
          )

        expect(results).toEqual([
          {
            ...mockRecord,
            stateUpdateId: 100,
            id: id1,
            l2TransactionsStatistics: undefined,
            prevHistoryId: undefined,
          },
          {
            ...mockRecord,
            stateUpdateId: 200,
            id: id2,
            l2TransactionsStatistics: undefined,
            prevHistoryId: undefined,
          },
        ])
      })
    }
  )

  describe(
    PreprocessedUserStatisticsRepository.prototype.deleteByStateUpdateId.name,
    () => {
      it('removes by state update id', async () => {
        const starkKey = StarkKey.fake('1234aa')
        for (const stateUpdateId of [100, 200, 1900]) {
          await repository.add(
            {
              ...mockRecord,
              starkKey,
              stateUpdateId,
              timestamp: Timestamp(stateUpdateId * 1000),
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
