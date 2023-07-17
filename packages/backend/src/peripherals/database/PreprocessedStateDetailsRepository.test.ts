import { Hash256, PedersenHash, Timestamp } from '@explorer/types'
import { expect } from 'earl'
import { Knex } from 'knex'

import { setupDatabaseTestSuite } from '../../test/database'
import { fakePreprocessedL2TransactionsStatistics } from '../../test/fakes'
import { Logger, LogLevel } from '../../tools/Logger'
import {
  PreprocessedStateDetailsRecord,
  PreprocessedStateDetailsRepository,
} from './PreprocessedStateDetailsRepository'
import { PreprocessedStateUpdateRepository } from './PreprocessedStateUpdateRepository'

const genericRecord: Omit<PreprocessedStateDetailsRecord, 'id'> = {
  stateUpdateId: 1900,
  stateTransitionHash: Hash256.fake(),
  rootHash: PedersenHash.fake(),
  blockNumber: 1_000_000,
  timestamp: Timestamp(900_000_000n),
  assetUpdateCount: 30,
  forcedTransactionCount: 2,
}

describe(PreprocessedStateDetailsRepository.name, () => {
  const { database } = setupDatabaseTestSuite()
  let trx: Knex.Transaction

  const repository = new PreprocessedStateDetailsRepository(
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

  describe(PreprocessedStateDetailsRepository.prototype.countAll.name, () => {
    it('counts all', async () => {
      for (const stateUpdateId of [1900, 100, 200]) {
        await repository.add(
          {
            ...genericRecord,
            stateUpdateId,
          },
          trx
        )
      }
      expect(await repository.countAll(trx)).toEqual(3)
    })
  })

  describe(
    PreprocessedStateDetailsRepository.prototype.deleteByStateUpdateId.name,
    () => {
      it('removes by state update id', async () => {
        for (const stateUpdateId of [1900, 100, 200]) {
          await repository.add(
            {
              ...genericRecord,
              stateUpdateId,
            },
            trx
          )
        }

        await repository.deleteByStateUpdateId(30_003_000, trx)
        expect(await repository.countAll(trx)).toEqual(3)
        await repository.deleteByStateUpdateId(1900, trx)
        expect(await repository.countAll(trx)).toEqual(2)
        await repository.deleteByStateUpdateId(100, trx)
        expect(await repository.countAll(trx)).toEqual(1)
        await repository.deleteByStateUpdateId(200, trx)
        expect(await repository.countAll(trx)).toEqual(0)
      })
    }
  )

  describe(
    PreprocessedStateDetailsRepository.prototype
      .findLastWithL2TransactionsStatistics.name,
    () => {
      it('returns undefined when no records', async () => {
        await repository.add(genericRecord, trx)

        const result = await repository.findLastWithL2TransactionsStatistics(
          trx
        )

        expect(result).toEqual(undefined)
      })

      it('returns most recent record with L2 transaction statistics', async () => {
        const l2TransactionsStatistics =
          fakePreprocessedL2TransactionsStatistics()
        const cumulativeL2TransactionsStatistics =
          fakePreprocessedL2TransactionsStatistics()
        const id = await repository.add(
          {
            ...genericRecord,
            stateUpdateId: 100,
            l2TransactionsStatistics,
            cumulativeL2TransactionsStatistics,
          },
          trx
        )
        await repository.add(
          {
            ...genericRecord,
            stateUpdateId: 200,
          },
          trx
        )
        await repository.add(
          {
            ...genericRecord,
            stateUpdateId: 1900,
          },
          trx
        )

        const result = await repository.findLastWithL2TransactionsStatistics(
          trx
        )

        expect(result).toEqual({
          ...genericRecord,
          id,
          stateUpdateId: 100,
          l2TransactionsStatistics,
          cumulativeL2TransactionsStatistics,
        })
      })
    }
  )

  describe(
    PreprocessedStateDetailsRepository.prototype
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
          { ...genericRecord, stateUpdateId: 100 },
          trx
        )
        const id2 = await repository.add(
          { ...genericRecord, stateUpdateId: 200 },
          trx
        )
        await repository.add(
          {
            ...genericRecord,
            stateUpdateId: 100,
            l2TransactionsStatistics:
              fakePreprocessedL2TransactionsStatistics(),
          },
          trx
        )
        await repository.add({ ...genericRecord, stateUpdateId: 1900 }, trx)

        const results =
          await repository.getAllWithoutL2TransactionStatisticsUpToStateUpdateId(
            1899,
            trx
          )

        expect(results).toEqual([
          {
            ...genericRecord,
            stateUpdateId: 100,
            id: id1,
            l2TransactionsStatistics: undefined,
            cumulativeL2TransactionsStatistics: undefined,
          },
          {
            ...genericRecord,
            stateUpdateId: 200,
            id: id2,
            l2TransactionsStatistics: undefined,
            cumulativeL2TransactionsStatistics: undefined,
          },
        ])
      })
    }
  )

  describe(
    PreprocessedStateDetailsRepository.prototype.getPaginated.name,
    () => {
      it('gets paginated', async () => {
        for (const stateUpdateId of [1900, 100, 200]) {
          await repository.add(
            {
              ...genericRecord,
              stateUpdateId,
            },
            trx
          )
        }
        const result1 = await repository.getPaginated(
          { offset: 0, limit: 2 },
          trx
        )
        expect(result1.map((r) => r.stateUpdateId)).toEqual([1900, 200])
        const result2 = await repository.getPaginated(
          { offset: 2, limit: 2 },
          trx
        )
        expect(result2.map((r) => r.stateUpdateId)).toEqual([100])
      })
    }
  )

  describe(`${PreprocessedStateDetailsRepository.prototype.add.name}, ${PreprocessedStateDetailsRepository.prototype.update.name} and ${PreprocessedStateDetailsRepository.prototype.findById.name}`, () => {
    it('adds, updates, finds by id and state update id', async () => {
      const id = await repository.add(genericRecord, trx)
      const fieldsToUpdate = {
        l2TransactionsStatistics: fakePreprocessedL2TransactionsStatistics(),
        cumulativeL2TransactionsStatistics:
          fakePreprocessedL2TransactionsStatistics(),
      }
      const updatedRecord = {
        ...genericRecord,
        ...fieldsToUpdate,
        id,
      }

      await repository.update(updatedRecord, trx)
      const recordById = await repository.findById(id, trx)
      const recordByStateUpdateId = await repository.findByStateUpdateId(
        updatedRecord.stateUpdateId,
        trx
      )

      expect(recordById).toEqual(updatedRecord)
      expect(recordByStateUpdateId).toEqual(updatedRecord)
    })
  })
})
