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

  const fakeRecord = (
    n: number,
    positionId = 1n,
    starkKey = StarkKey.fake()
  ): ForcedWithdrawTransactionRecord => ({
    hash: Hash256.fake(n.toString().repeat(10)),
    starkKey,
    amount: 1n,
    positionId,
  })

  describe('status history', () => {
    const record = fakeRecord(1)

    it('adds single record and queries it', async () => {
      await repository.addSent({ ...record, timestamp: Timestamp(1001) })

      const result = await repository.findByTransactionHash(record.hash)
      expect(result).toEqual({
        ...record,
        history: [{ status: 'sent', timestamp: Timestamp(1001) }],
      })
    })

    it('returns undefined for unknown hash', async () => {
      const result = await repository.findByTransactionHash(record.hash)
      expect(result).toEqual(undefined)
    })

    it('can track a regular flow', async () => {
      await repository.addSent({ ...record, timestamp: Timestamp(1001) })
      await repository.addMined({
        ...record,
        timestamp: Timestamp(1002),
        blockNumber: 123,
      })
      await repository.addIncluded({
        hash: record.hash,
        timestamp: Timestamp(1003),
        blockNumber: 456,
        stateUpdateId: 100,
      })

      const result = await repository.findByTransactionHash(record.hash)
      expect(result).toEqual({
        ...record,
        history: [
          { status: 'sent', timestamp: Timestamp(1001) },
          { status: 'mined', timestamp: Timestamp(1002), blockNumber: 123 },
          {
            status: 'included',
            timestamp: Timestamp(1003),
            blockNumber: 456,
            stateUpdateId: 100,
          },
        ],
      })
    })

    it('can track a forgotten flow', async () => {
      await repository.addSent({ ...record, timestamp: Timestamp(1001) })
      await repository.addForgotten({
        hash: record.hash,
        timestamp: Timestamp(1002),
      })

      const result = await repository.findByTransactionHash(record.hash)
      expect(result).toEqual({
        ...record,
        history: [
          { status: 'sent', timestamp: Timestamp(1001) },
          { status: 'forgotten', timestamp: Timestamp(1002) },
        ],
      })
    })

    it('can track a reverted flow', async () => {
      await repository.addSent({ ...record, timestamp: Timestamp(1001) })
      await repository.addReverted({
        hash: record.hash,
        timestamp: Timestamp(1002),
        blockNumber: 123,
      })

      const result = await repository.findByTransactionHash(record.hash)
      expect(result).toEqual({
        ...record,
        history: [
          { status: 'sent', timestamp: Timestamp(1001) },
          {
            status: 'reverted',
            timestamp: Timestamp(1002),
            blockNumber: 123,
          },
        ],
      })
    })

    it('orders events by timestamp', async () => {
      await repository.addIncluded({
        hash: record.hash,
        timestamp: Timestamp(1004),
        blockNumber: 789,
        stateUpdateId: 100,
      })
      await repository.addReverted({
        hash: record.hash,
        timestamp: Timestamp(1002),
        blockNumber: 123,
      })
      await repository.addMined({
        ...record,
        hash: record.hash,
        timestamp: Timestamp(1003),
        blockNumber: 456,
      })
      await repository.addSent({ ...record, timestamp: Timestamp(1001) })

      const result = await repository.findByTransactionHash(record.hash)
      expect(result).toEqual({
        ...record,
        history: [
          { status: 'sent', timestamp: Timestamp(1001) },
          {
            status: 'reverted',
            timestamp: Timestamp(1002),
            blockNumber: 123,
          },
          { status: 'mined', timestamp: Timestamp(1003), blockNumber: 456 },
          {
            status: 'included',
            timestamp: Timestamp(1004),
            blockNumber: 789,
            stateUpdateId: 100,
          },
        ],
      })
    })

    it('prevents adding the same status twice', async () => {
      await repository.addSent({ ...record, timestamp: Timestamp(1001) })
      await expect(
        repository.addSent({ ...record, timestamp: Timestamp(1001) })
      ).toBeRejected()
    })
  })

  describe(ForcedWithdrawRepository.prototype.getMinedNotIncluded.name, () => {
    it('returns empty array if there are no mined transactions', async () => {
      const result = await repository.getMinedNotIncluded()
      expect(result).toEqual([])
    })

    it('returns only mined and not included transactions', async () => {
      const record1 = fakeRecord(1)
      const record2 = fakeRecord(2)
      const record3 = fakeRecord(3)
      const record4 = fakeRecord(4)

      await repository.addSent({ ...record1, timestamp: Timestamp(1001) })
      await repository.addSent({ ...record2, timestamp: Timestamp(2001) })
      await repository.addMined({
        ...record2,
        timestamp: Timestamp(2002),
        blockNumber: 123,
      })
      await repository.addMined({
        ...record3,
        timestamp: Timestamp(3002),
        blockNumber: 456,
      })
      await repository.addMined({
        ...record4,
        timestamp: Timestamp(4002),
        blockNumber: 789,
      })
      await repository.addIncluded({
        hash: record4.hash,
        timestamp: Timestamp(4003),
        blockNumber: 1234,
        stateUpdateId: 1,
      })

      const result = await repository.getMinedNotIncluded()
      expect(result).toEqual([
        {
          ...record2,
          history: [
            { status: 'sent', timestamp: Timestamp(2001) },
            { status: 'mined', timestamp: Timestamp(2002), blockNumber: 123 },
          ],
        },
        {
          ...record3,
          history: [
            { status: 'mined', timestamp: Timestamp(3002), blockNumber: 456 },
          ],
        },
      ])
    })
  })

  describe(ForcedWithdrawRepository.prototype.getJustSentHashes.name, () => {
    it('returns empty array if there are no sent transactions', async () => {
      const result = await repository.getJustSentHashes()
      expect(result).toEqual([])
    })

    it('returns transactions that only have a sent status', async () => {
      const record1 = fakeRecord(1)
      const record2 = fakeRecord(2)
      const record3 = fakeRecord(3)
      const record4 = fakeRecord(4)

      await repository.addSent({ ...record1, timestamp: Timestamp(1001) })
      await repository.addSent({ ...record2, timestamp: Timestamp(2001) })
      await repository.addSent({ ...record3, timestamp: Timestamp(3001) })
      await repository.addMined({
        ...record3,
        timestamp: Timestamp(3002),
        blockNumber: 123,
      })
      await repository.addMined({
        ...record4,
        timestamp: Timestamp(4002),
        blockNumber: 456,
      })

      const result = await repository.getJustSentHashes()
      expect(result).toEqual([record1.hash, record2.hash])
    })
  })

  describe(ForcedWithdrawRepository.prototype.getByPositionId.name, () => {
    it('returns empty array if there are no transactions', async () => {
      const result = await repository.getByPositionId(1n)
      expect(result).toEqual([])
    })

    it('returns transactions that have the given position id', async () => {
      const record1 = fakeRecord(1, 100n)
      const record2 = fakeRecord(2, 200n)
      const record3 = fakeRecord(3, 200n)

      await repository.addSent({ ...record1, timestamp: Timestamp(1001) })
      await repository.addSent({ ...record2, timestamp: Timestamp(2001) })
      await repository.addSent({ ...record3, timestamp: Timestamp(3001) })
      await repository.addMined({
        ...record3,
        timestamp: Timestamp(3002),
        blockNumber: 123,
      })

      const result = await repository.getByPositionId(200n)
      expect(result).toEqual([
        {
          ...record2,
          history: [{ status: 'sent', timestamp: Timestamp(2001) }],
        },
        {
          ...record3,
          history: [
            { status: 'sent', timestamp: Timestamp(3001) },
            { status: 'mined', timestamp: Timestamp(3002), blockNumber: 123 },
          ],
        },
      ])
    })
  })

  describe(ForcedWithdrawRepository.prototype.getByStarkKey.name, () => {
    it('returns empty array if there are no transactions', async () => {
      const result = await repository.getByStarkKey(StarkKey.fake())
      expect(result).toEqual([])
    })

    it('returns transactions that have the given stark key id', async () => {
      const starkKeyA = StarkKey.fake('aaa')
      const starkKeyB = StarkKey.fake('bbb')
      const record1 = fakeRecord(1, 1n, starkKeyA)
      const record2 = fakeRecord(2, 2n, starkKeyB)
      const record3 = fakeRecord(3, 3n, starkKeyB)

      await repository.addSent({ ...record1, timestamp: Timestamp(1001) })
      await repository.addSent({ ...record2, timestamp: Timestamp(2001) })
      await repository.addSent({ ...record3, timestamp: Timestamp(3001) })
      await repository.addMined({
        ...record3,
        timestamp: Timestamp(3002),
        blockNumber: 123,
      })

      const result = await repository.getByStarkKey(starkKeyB)
      expect(result).toEqual([
        {
          ...record2,
          history: [{ status: 'sent', timestamp: Timestamp(2001) }],
        },
        {
          ...record3,
          history: [
            { status: 'sent', timestamp: Timestamp(3001) },
            { status: 'mined', timestamp: Timestamp(3002), blockNumber: 123 },
          ],
        },
      ])
    })
  })

  describe(ForcedWithdrawRepository.prototype.getByStateUpdateId.name, () => {
    it('returns empty array if there are no transactions', async () => {
      const result = await repository.getByStateUpdateId(1)
      expect(result).toEqual([])
    })

    it('returns transactions that have the given stark key id', async () => {
      const record1 = fakeRecord(1)
      const record2 = fakeRecord(2)
      const record3 = fakeRecord(3)
      const record4 = fakeRecord(4)

      await repository.addSent({ ...record1, timestamp: Timestamp(1001) })
      await repository.addMined({
        ...record1,
        timestamp: Timestamp(1002),
        blockNumber: 102,
      })
      await repository.addMined({
        ...record2,
        timestamp: Timestamp(2002),
        blockNumber: 202,
      })
      await repository.addIncluded({
        hash: record2.hash,
        timestamp: Timestamp(2003),
        blockNumber: 203,
        stateUpdateId: 1234,
      })
      await repository.addSent({ ...record3, timestamp: Timestamp(3001) })
      await repository.addMined({
        ...record3,
        timestamp: Timestamp(3002),
        blockNumber: 302,
      })
      await repository.addIncluded({
        hash: record3.hash,
        timestamp: Timestamp(3003),
        blockNumber: 303,
        stateUpdateId: 1234,
      })
      await repository.addMined({
        ...record4,
        timestamp: Timestamp(4002),
        blockNumber: 402,
      })
      await repository.addIncluded({
        hash: record4.hash,
        timestamp: Timestamp(4003),
        blockNumber: 403,
        stateUpdateId: 5678,
      })

      const result = await repository.getByStateUpdateId(1234)
      expect(result).toEqual([
        {
          ...record2,
          history: [
            { status: 'mined', timestamp: Timestamp(2002), blockNumber: 202 },
            {
              status: 'included',
              timestamp: Timestamp(2003),
              blockNumber: 203,
              stateUpdateId: 1234,
            },
          ],
        },
        {
          ...record3,
          history: [
            { status: 'sent', timestamp: Timestamp(3001) },
            { status: 'mined', timestamp: Timestamp(3002), blockNumber: 302 },
            {
              status: 'included',
              timestamp: Timestamp(3003),
              blockNumber: 303,
              stateUpdateId: 1234,
            },
          ],
        },
      ])
    })
  })

  describe(ForcedWithdrawRepository.prototype.deleteAfter.name, () => {
    it('removes only some transactions', async () => {
      const record1 = fakeRecord(1)
      const record2 = fakeRecord(2)
      const record3 = fakeRecord(3)

      await repository.addSent({ ...record1, timestamp: Timestamp(1001) })
      await repository.addMined({
        ...record1,
        timestamp: Timestamp(1002),
        blockNumber: 421,
      })
      await repository.addMined({
        ...record2,
        timestamp: Timestamp(2001),
        blockNumber: 421,
      })
      await repository.addMined({
        ...record3,
        timestamp: Timestamp(3002),
        blockNumber: 420,
      })

      await repository.deleteAfter(420)

      expect(await repository.findByTransactionHash(record1.hash)).toEqual({
        ...record1,
        history: [{ status: 'sent', timestamp: Timestamp(1001) }],
      })
      expect(await repository.findByTransactionHash(record2.hash)).toEqual(
        undefined
      )
      expect(await repository.findByTransactionHash(record3.hash)).toEqual({
        ...record3,
        history: [
          { status: 'mined', timestamp: Timestamp(3002), blockNumber: 420 },
        ],
      })
    })
  })
})
