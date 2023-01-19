import { Timestamp } from '@explorer/types'
import { expect } from 'earljs'

import { setupDatabaseTestSuite } from '../../../test/database'
import { Logger } from '../../../tools/Logger'
import { CombinedForcedRepository } from './CombinedForcedRepository'
import { ForcedTradeRepository } from './ForcedTradeRepository'
import { fakeRecord as fakeTradeRecord } from './ForcedTradeRepository.test'
import { ForcedWithdrawRepository } from './ForcedWithdrawRepository'
import { fakeRecord as fakeWithdrawRecord } from './ForcedWithdrawRepository.test'

describe(CombinedForcedRepository.name, () => {
  const { database } = setupDatabaseTestSuite()
  const repository = new CombinedForcedRepository(database, Logger.SILENT)
  const forcedWithdrawRepository = new ForcedWithdrawRepository(
    database,
    Logger.SILENT
  )
  const forcedTradeRepository = new ForcedTradeRepository(
    database,
    Logger.SILENT
  )

  afterEach(async () => {
    await forcedWithdrawRepository.deleteAll()
    await forcedTradeRepository.deleteAll()
  })

  describe(CombinedForcedRepository.prototype.getPaginated.name, () => {
    it('returns combined forced withdraw and trade records', async () => {
      const record1 = fakeWithdrawRecord(1)
      await forcedWithdrawRepository.addSent({
        ...record1,
        timestamp: Timestamp(1001),
      })
      await forcedWithdrawRepository.addMined({
        ...record1,
        timestamp: Timestamp(1002),
        blockNumber: 1234,
      })

      const record2 = fakeTradeRecord(2, { isABuyingSynthetic: false })
      await forcedTradeRepository.addSent({
        ...record2,
        timestamp: Timestamp(2001),
        offerId: 2,
      })
      await forcedTradeRepository.addMined({
        ...record2,
        timestamp: Timestamp(2002),
        blockNumber: 5678,
      })
      await forcedTradeRepository.addIncluded({
        hash: record2.hash,
        timestamp: Timestamp(2003),
        blockNumber: 9012,
        stateUpdateId: 1,
      })

      const record3 = fakeWithdrawRecord(2)
      await forcedWithdrawRepository.addSent({
        ...record3,
        timestamp: Timestamp(3001),
      })
      await forcedWithdrawRepository.addMined({
        ...record3,
        timestamp: Timestamp(3002),
        blockNumber: 5678,
      })
      await forcedWithdrawRepository.addIncluded({
        hash: record3.hash,
        timestamp: Timestamp(3003),
        blockNumber: 9012,
        stateUpdateId: 1,
      })

      const record4 = fakeTradeRecord(1, { isABuyingSynthetic: true })
      await forcedTradeRepository.addSent({
        ...record4,
        timestamp: Timestamp(4001),
        offerId: 1,
      })
      await forcedTradeRepository.addMined({
        ...record4,
        timestamp: Timestamp(4002),
        blockNumber: 1234,
      })

      const results = await repository.getPaginated({ limit: 10, offset: 0 })
      expect(results).toEqual([
        {
          hash: record4.hash,
          timestamp: Timestamp(4002),
          type: 'trade',
          status: 'mined',
          isABuying: record4.isABuyingSynthetic,
          positionIdA: record4.positionIdA,
          positionIdB: record4.positionIdB,
          amount: record4.syntheticAmount,
          assetId: record4.syntheticAssetId,
        },
        {
          hash: record3.hash,
          timestamp: Timestamp(3003),
          type: 'withdraw',
          status: 'included',
          isABuying: false,
          positionIdA: record3.positionId,
          positionIdB: undefined,
          amount: record3.amount,
          assetId: undefined,
        },
        {
          hash: record2.hash,
          timestamp: Timestamp(2003),
          type: 'trade',
          status: 'included',
          isABuying: record2.isABuyingSynthetic,
          positionIdA: record2.positionIdA,
          positionIdB: record2.positionIdB,
          amount: record2.syntheticAmount,
          assetId: record2.syntheticAssetId,
        },
        {
          hash: record1.hash,
          timestamp: Timestamp(1002),
          type: 'withdraw',
          status: 'mined',
          isABuying: false,
          positionIdA: record1.positionId,
          positionIdB: undefined,
          amount: record1.amount,
          assetId: undefined,
        },
      ])
    })

    it('supports the limit parameter', async () => {
      const records = new Array({ length: 20 }).map((_, i) =>
        fakeWithdrawRecord(i + 1)
      )
      for (const [i, record] of records.entries()) {
        await forcedWithdrawRepository.addSent({
          ...record,
          timestamp: Timestamp(1000 + i + 1),
        })
      }
      const results = await repository.getPaginated({ limit: 10, offset: 0 })
      const hashes = results.map((x) => x.hash)

      const last10HashesReversed = records
        .slice(-10)
        .map((x) => x.hash)
        .reverse()
      expect(hashes).toEqual(last10HashesReversed)
    })

    it('supports the offset parameter', async () => {
      const records = new Array({ length: 20 }).map((_, i) =>
        fakeWithdrawRecord(i + 1)
      )
      for (const [i, record] of records.entries()) {
        await forcedWithdrawRepository.addSent({
          ...record,
          timestamp: Timestamp(1000 + i + 1),
        })
      }
      const results = await repository.getPaginated({ limit: 10, offset: 5 })
      const hashes = results.map((x) => x.hash)

      const hashes5to15Reversed = records
        .slice(-15, -5)
        .map((x) => x.hash)
        .reverse()
      expect(hashes).toEqual(hashes5to15Reversed)
    })
  })
})
