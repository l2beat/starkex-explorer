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

  describe('status history', () => {
    const record: ForcedWithdrawTransactionRecord = {
      hash: Hash256.fake(),
      starkKey: StarkKey.fake(),
      amount: 1n,
      positionId: 2n,
    }

    const sentTimestamp = Timestamp.now()
    const forgottenTimestamp = Timestamp(Number(sentTimestamp) + 1000)
    const revertedTimestamp = Timestamp(Number(forgottenTimestamp) + 1000)
    const minedTimestamp = Timestamp(Number(revertedTimestamp) + 1000)
    const includedTimestamp = Timestamp(Number(minedTimestamp) + 1000)

    it('adds single record and queries it', async () => {
      await repository.addSent({ ...record, timestamp: sentTimestamp })

      const result = await repository.findByTransactionHash(record.hash)
      expect(result).toEqual({
        ...record,
        history: [{ status: 'sent', timestamp: sentTimestamp }],
      })
    })

    it('returns undefined for unknown hash', async () => {
      const result = await repository.findByTransactionHash(record.hash)
      expect(result).toEqual(undefined)
    })

    it('can track a regular flow', async () => {
      await repository.addSent({ ...record, timestamp: sentTimestamp })
      await repository.addMined({
        ...record,
        timestamp: minedTimestamp,
        blockNumber: 123,
      })
      await repository.addIncluded({
        hash: record.hash,
        timestamp: includedTimestamp,
        blockNumber: 456,
        stateUpdateId: 100,
      })

      const result = await repository.findByTransactionHash(record.hash)
      expect(result).toEqual({
        ...record,
        history: [
          { status: 'sent', timestamp: sentTimestamp },
          { status: 'mined', timestamp: minedTimestamp, blockNumber: 123 },
          {
            status: 'included',
            timestamp: includedTimestamp,
            blockNumber: 456,
            stateUpdateId: 100,
          },
        ],
      })
    })

    it('can track a forgotten flow', async () => {
      await repository.addSent({ ...record, timestamp: sentTimestamp })
      await repository.addForgotten({
        hash: record.hash,
        timestamp: forgottenTimestamp,
      })

      const result = await repository.findByTransactionHash(record.hash)
      expect(result).toEqual({
        ...record,
        history: [
          { status: 'sent', timestamp: sentTimestamp },
          { status: 'forgotten', timestamp: forgottenTimestamp },
        ],
      })
    })

    it('can track a reverted flow', async () => {
      await repository.addSent({ ...record, timestamp: sentTimestamp })
      await repository.addReverted({
        hash: record.hash,
        timestamp: revertedTimestamp,
        blockNumber: 123,
      })

      const result = await repository.findByTransactionHash(record.hash)
      expect(result).toEqual({
        ...record,
        history: [
          { status: 'sent', timestamp: sentTimestamp },
          {
            status: 'reverted',
            timestamp: revertedTimestamp,
            blockNumber: 123,
          },
        ],
      })
    })

    it('orders events by timestamp', async () => {
      await repository.addIncluded({
        hash: record.hash,
        timestamp: includedTimestamp,
        blockNumber: 789,
        stateUpdateId: 100,
      })
      await repository.addReverted({
        hash: record.hash,
        timestamp: revertedTimestamp,
        blockNumber: 123,
      })
      await repository.addMined({
        ...record,
        hash: record.hash,
        timestamp: minedTimestamp,
        blockNumber: 456,
      })
      await repository.addSent({ ...record, timestamp: sentTimestamp })

      const result = await repository.findByTransactionHash(record.hash)
      expect(result).toEqual({
        ...record,
        history: [
          { status: 'sent', timestamp: sentTimestamp },
          {
            status: 'reverted',
            timestamp: revertedTimestamp,
            blockNumber: 123,
          },
          { status: 'mined', timestamp: minedTimestamp, blockNumber: 456 },
          {
            status: 'included',
            timestamp: includedTimestamp,
            blockNumber: 789,
            stateUpdateId: 100,
          },
        ],
      })
    })

    it('prevents adding the same status twice', async () => {
      await repository.addSent({ ...record, timestamp: sentTimestamp })
      await expect(
        repository.addSent({ ...record, timestamp: sentTimestamp })
      ).toBeRejected()
    })
  })

  describe(ForcedWithdrawRepository.prototype.getMinedNotIncluded.name, () => {
    it('returns empty array if there are no mined transactions', async () => {
      const result = await repository.getMinedNotIncluded()
      expect(result).toEqual([])
    })

    it('returns only mined and not included transactions', async () => {
      const fakeRecord = (n: number): ForcedWithdrawTransactionRecord => ({
        hash: Hash256.fake(n.toString().repeat(10)),
        starkKey: StarkKey.fake(),
        amount: 1n,
        positionId: 2n,
      })
      const record1 = fakeRecord(1)
      const record2 = fakeRecord(2)
      const record3 = fakeRecord(3)
      const record4 = fakeRecord(4)

      const sentTimestamp1 = Timestamp.now()
      const sentTimestamp2 = Timestamp(Number(sentTimestamp1) + 1000)
      const minedTimestamp2 = Timestamp(Number(sentTimestamp2) + 1000)
      const minedTimestamp3 = Timestamp(Number(minedTimestamp2) + 1000)
      const minedTimestamp4 = Timestamp(Number(minedTimestamp3) + 1000)
      const includedTimestamp4 = Timestamp(Number(minedTimestamp4) + 1000)

      await repository.addSent({ ...record1, timestamp: sentTimestamp1 })
      await repository.addSent({ ...record2, timestamp: sentTimestamp2 })
      await repository.addMined({
        ...record2,
        timestamp: minedTimestamp2,
        blockNumber: 123,
      })
      await repository.addMined({
        ...record3,
        timestamp: minedTimestamp3,
        blockNumber: 456,
      })
      await repository.addMined({
        ...record4,
        timestamp: minedTimestamp4,
        blockNumber: 789,
      })
      await repository.addIncluded({
        hash: record4.hash,
        timestamp: includedTimestamp4,
        blockNumber: 1234,
        stateUpdateId: 1,
      })

      const result = await repository.getMinedNotIncluded()
      expect(result).toEqual([
        {
          ...record2,
          history: [
            { status: 'sent', timestamp: sentTimestamp2 },
            { status: 'mined', timestamp: minedTimestamp2, blockNumber: 123 },
          ],
        },
        {
          ...record3,
          history: [
            { status: 'mined', timestamp: minedTimestamp3, blockNumber: 456 },
          ],
        },
      ])
    })
  })
})
