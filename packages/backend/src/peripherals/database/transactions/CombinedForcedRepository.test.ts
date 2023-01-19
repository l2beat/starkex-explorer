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
    it('returns forced withdraw records', async () => {
      const record1 = fakeWithdrawRecord(1)
      const record2 = fakeWithdrawRecord(2)

      await forcedWithdrawRepository.addSent({
        ...record1,
        timestamp: Timestamp(1001),
      })
      await forcedWithdrawRepository.addMined({
        ...record1,
        timestamp: Timestamp(1002),
        blockNumber: 1234,
      })
      await forcedWithdrawRepository.addSent({
        ...record2,
        timestamp: Timestamp(2001),
      })
      await forcedWithdrawRepository.addMined({
        ...record2,
        timestamp: Timestamp(2002),
        blockNumber: 5678,
      })
      await forcedWithdrawRepository.addIncluded({
        hash: record2.hash,
        timestamp: Timestamp(2003),
        blockNumber: 9012,
        stateUpdateId: 1,
      })

      const results = await repository.getPaginated({ limit: 10, offset: 0 })
      expect(results).toEqual([
        {
          hash: record2.hash,
          timestamp: Timestamp(2003),
          type: 'withdraw',
          status: 'included',
          positionId: record2.positionId,
          amount: record2.amount,
          assetId: undefined,
        },
        {
          hash: record1.hash,
          timestamp: Timestamp(1002),
          type: 'withdraw',
          status: 'mined',
          positionId: record1.positionId,
          amount: record1.amount,
          assetId: undefined,
        },
      ])
    })

    it('returns forced trade records', async () => {
      const record1 = fakeTradeRecord(1, { isABuyingSynthetic: true })
      const record2 = fakeTradeRecord(2, { isABuyingSynthetic: false })

      await forcedTradeRepository.addSent({
        ...record1,
        timestamp: Timestamp(1001),
        offerId: 1,
      })
      await forcedTradeRepository.addMined({
        ...record1,
        timestamp: Timestamp(1002),
        blockNumber: 1234,
      })
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

      const results = await repository.getPaginated({ limit: 10, offset: 0 })
      expect(results).toEqual([
        {
          hash: record2.hash,
          timestamp: Timestamp(2003),
          type: 'sell',
          status: 'included',
          positionId: record2.positionIdA,
          amount: record2.syntheticAmount,
          assetId: record2.syntheticAssetId,
        },
        {
          hash: record1.hash,
          timestamp: Timestamp(1002),
          type: 'buy',
          status: 'mined',
          positionId: record1.positionIdA,
          amount: record1.syntheticAmount,
          assetId: record1.syntheticAssetId,
        },
      ])
    })
  })
})
