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
})
