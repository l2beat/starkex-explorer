import { EthereumAddress, Hash256, StarkKey, Timestamp } from '@explorer/types'
import { Logger } from '@l2beat/backend-tools'
import { expect, mockFn, mockObject } from 'earl'
import { Knex } from 'knex'
import { it } from 'mocha'

import { L2TransactionRepository } from '../../peripherals/database/L2TransactionRepository'
import {
  StateUpdateRecord,
  StateUpdateRepository,
} from '../../peripherals/database/StateUpdateRepository'
import { FeederGatewayClient } from '../../peripherals/starkware/FeederGatewayClient'
import { PerpetualBatchInfo } from '../../peripherals/starkware/toPerpetualBatchInfo'
import { FeederGatewayCollector } from './FeederGatewayCollector'

describe(FeederGatewayCollector.name, () => {
  describe(FeederGatewayCollector.prototype.collect.name, () => {
    it('should collect transactions from scratch if no transactions were synced before', async () => {
      const knexTransaction = mockObject<Knex.Transaction>()
      const mockL2TransactionRepository = mockObject<L2TransactionRepository>({
        findLatestStateUpdateId: mockFn().resolvesTo(undefined),
        runInTransactionWithLockedTable: mockFn(
          async (fun: (trx: Knex.Transaction) => Promise<void>) => {
            await fun(knexTransaction)
          }
        ),
      })
      const mockStateUpdateRepository = mockObject<StateUpdateRepository>({
        findLast: mockFn().resolvesTo(fakeStateUpdateRecord(5)),
      })
      const feederGatewayCollector = new FeederGatewayCollector(
        mockObject<FeederGatewayClient>(),
        mockL2TransactionRepository,
        mockStateUpdateRepository,
        Logger.SILENT,
        true
      )
      const mockCollectForStateUpdate = mockFn().resolvesTo(undefined)
      feederGatewayCollector.collectForStateUpdate = mockCollectForStateUpdate

      await feederGatewayCollector.collect()

      expect(mockStateUpdateRepository.findLast).toHaveBeenCalledTimes(1)
      expect(
        mockL2TransactionRepository.findLatestStateUpdateId
      ).toHaveBeenCalledTimes(1)
      expect(
        mockL2TransactionRepository.runInTransactionWithLockedTable
      ).toHaveBeenCalledTimes(1)

      for (const i of [1, 2, 3, 4, 5]) {
        expect(mockCollectForStateUpdate).toHaveBeenCalledWith(
          i,
          knexTransaction
        )
      }
    })

    it('should collect transactions from last state update if some transactions were synced before', async () => {
      const knexTransaction = mockObject<Knex.Transaction>({})
      const mockL2TransactionRepository = mockObject<L2TransactionRepository>({
        findLatestStateUpdateId: mockFn().resolvesTo(6),
        runInTransactionWithLockedTable: mockFn(
          async (fun: (trx: Knex.Transaction) => Promise<void>) => {
            await fun(knexTransaction)
          }
        ),
      })
      const mockStateUpdateRepository = mockObject<StateUpdateRepository>({
        findLast: mockFn().resolvesTo(fakeStateUpdateRecord(10)),
      })
      const feederGatewayCollector = new FeederGatewayCollector(
        mockObject<FeederGatewayClient>(),
        mockL2TransactionRepository,
        mockStateUpdateRepository,
        Logger.SILENT,
        true
      )
      const mockCollectForStateUpdate = mockFn().resolvesTo(undefined)
      feederGatewayCollector.collectForStateUpdate = mockCollectForStateUpdate

      await feederGatewayCollector.collect()

      expect(mockStateUpdateRepository.findLast).toHaveBeenCalledTimes(1)
      expect(
        mockL2TransactionRepository.findLatestStateUpdateId
      ).toHaveBeenCalledTimes(1)

      expect(
        mockL2TransactionRepository.runInTransactionWithLockedTable
      ).toHaveBeenCalledTimes(1)

      for (const i of [7, 8, 9, 10]) {
        expect(mockCollectForStateUpdate).toHaveBeenCalledWith(
          i,
          knexTransaction
        )
      }
    })

    it('should stop collecting transactions if there is no state update in db', async () => {
      const mockedL2TransactionRepository = mockObject<L2TransactionRepository>(
        {
          findLatestStateUpdateId: mockFn(),
        }
      )
      const mockedStateUpdateRepository = mockObject<StateUpdateRepository>({
        findLast: mockFn().resolvesTo(undefined),
      })
      const feederGatewayCollector = new FeederGatewayCollector(
        mockObject<FeederGatewayClient>(),
        mockedL2TransactionRepository,
        mockedStateUpdateRepository,
        Logger.SILENT,
        true
      )

      await feederGatewayCollector.collect()

      expect(
        mockedL2TransactionRepository.findLatestStateUpdateId
      ).not.toHaveBeenCalled()
    })

    it('should not do anything if l2 transactions are disabled', async () => {
      const mockedL2TransactionRepository = mockObject<L2TransactionRepository>(
        {
          findLatestStateUpdateId: mockFn(),
        }
      )
      const feederGatewayCollector = new FeederGatewayCollector(
        mockObject<FeederGatewayClient>(),
        mockedL2TransactionRepository,
        mockObject<StateUpdateRepository>(),
        Logger.SILENT,
        false
      )

      await feederGatewayCollector.collect()

      expect(
        mockedL2TransactionRepository.findLatestStateUpdateId
      ).not.toHaveBeenCalled()
    })
  })

  describe(FeederGatewayCollector.prototype.collectForStateUpdate.name, () => {
    it('should collect l2 transactions for given state update id', async () => {
      const stateUpdateId = 6
      const timestampsGroupedByTransactionId = {
        11: [Timestamp(100), Timestamp(200)],
      }
      const mockFeederGatewayClient = mockObject<FeederGatewayClient>({
        getPerpetualBatchInfo: mockFn(async (batchId: number) =>
          fakePerpetualBatchInfo(batchId)
        ),
      })
      const knexTransaction = mockObject<Knex.Transaction>({})
      const mockL2TransactionRepository = mockObject<L2TransactionRepository>({
        findLatestStateUpdateId: mockFn().resolvesTo(undefined),
        addFeederGatewayTransaction: mockFn().resolvesTo(1),
        runInTransactionWithLockedTable: mockFn(
          async (fun: (trx: Knex.Transaction) => Promise<void>) => {
            await fun(knexTransaction)
          }
        ),
        getTimestampsGroupedByTransactionId: mockFn().resolvesTo(
          timestampsGroupedByTransactionId
        ),
        deleteByTransactionIds: mockFn().resolvesTo(undefined),
      })
      const mockStateUpdateRepository = mockObject<StateUpdateRepository>({
        findById: mockFn(async (id: number) => fakeStateUpdateRecord(id)),
        findLast: mockFn().resolvesTo(fakeStateUpdateRecord(5)),
      })
      const feederGatewayCollector = new FeederGatewayCollector(
        mockFeederGatewayClient,
        mockL2TransactionRepository,
        mockStateUpdateRepository,
        Logger.SILENT,
        true
      )
      const getL2TransactionTimestampMockFn = mockFn()
        .returnsOnce(Timestamp(100))
        .returnsOnce(Timestamp(200))
        .returnsOnce(Timestamp(300))
        .returnsOnce(Timestamp(400))

      feederGatewayCollector.getL2TransactionTimestamp =
        getL2TransactionTimestampMockFn

      await feederGatewayCollector.collectForStateUpdate(
        stateUpdateId,
        knexTransaction
      )

      expect(mockStateUpdateRepository.findById).toHaveBeenOnlyCalledWith(
        stateUpdateId,
        knexTransaction
      )
      const stateUpdate = fakeStateUpdateRecord(stateUpdateId)
      expect(
        mockFeederGatewayClient.getPerpetualBatchInfo
      ).toHaveBeenOnlyCalledWith(stateUpdate.batchId)

      expect(
        mockL2TransactionRepository.getTimestampsGroupedByTransactionId
      ).toHaveBeenOnlyCalledWith([11, 12], knexTransaction)
      expect(
        mockL2TransactionRepository.deleteByTransactionIds
      ).toHaveBeenOnlyCalledWith([11, 12], knexTransaction)

      const perpetualBatchInfo = fakePerpetualBatchInfo(stateUpdate.batchId)
      expect(getL2TransactionTimestampMockFn).toHaveBeenNthCalledWith(
        1,
        timestampsGroupedByTransactionId,
        perpetualBatchInfo.transactionsInfo[0]!.originalTransactionId,
        perpetualBatchInfo.timeCreated
      )
      expect(
        mockL2TransactionRepository.addFeederGatewayTransaction
      ).toHaveBeenNthCalledWith(
        1,
        {
          stateUpdateId: stateUpdate.id,
          blockNumber: stateUpdate.blockNumber,
          transactionId:
            perpetualBatchInfo.transactionsInfo[0]!.originalTransactionId,
          timestamp: Timestamp(100),
          data: perpetualBatchInfo.transactionsInfo[0]!.originalTransaction,
          state: undefined,
        },
        knexTransaction
      )
      expect(getL2TransactionTimestampMockFn).toHaveBeenNthCalledWith(
        2,
        timestampsGroupedByTransactionId,
        perpetualBatchInfo.transactionsInfo[1]!.originalTransactionId,
        perpetualBatchInfo.timeCreated
      )
      expect(
        mockL2TransactionRepository.addFeederGatewayTransaction
      ).toHaveBeenNthCalledWith(
        2,
        {
          stateUpdateId: stateUpdate.id,
          blockNumber: stateUpdate.blockNumber,
          transactionId:
            perpetualBatchInfo.transactionsInfo[1]!.originalTransactionId,
          timestamp: Timestamp(200),
          data: perpetualBatchInfo.transactionsInfo[1]!.originalTransaction,
          state: 'replaced',
        },
        knexTransaction
      )
      expect(getL2TransactionTimestampMockFn).toHaveBeenNthCalledWith(
        3,
        timestampsGroupedByTransactionId,
        perpetualBatchInfo.transactionsInfo[1]!.originalTransactionId,
        perpetualBatchInfo.timeCreated,
        0
      )
      expect(
        mockL2TransactionRepository.addFeederGatewayTransaction
      ).toHaveBeenNthCalledWith(
        3,
        {
          stateUpdateId: stateUpdate.id,
          blockNumber: stateUpdate.blockNumber,
          transactionId:
            perpetualBatchInfo.transactionsInfo[1]!.originalTransactionId,
          data: perpetualBatchInfo.transactionsInfo[1]!
            .alternativeTransactions![0]!,
          timestamp: Timestamp(300),
          state: 'alternative',
        },
        knexTransaction
      )
      expect(getL2TransactionTimestampMockFn).toHaveBeenNthCalledWith(
        4,
        timestampsGroupedByTransactionId,
        perpetualBatchInfo.transactionsInfo[1]!.originalTransactionId,
        perpetualBatchInfo.timeCreated,
        1
      )
      expect(
        mockL2TransactionRepository.addFeederGatewayTransaction
      ).toHaveBeenNthCalledWith(
        4,
        {
          stateUpdateId: stateUpdate.id,
          blockNumber: stateUpdate.blockNumber,
          transactionId:
            perpetualBatchInfo.transactionsInfo[1]!.originalTransactionId,
          data: perpetualBatchInfo.transactionsInfo[1]!
            .alternativeTransactions![1]!,
          timestamp: Timestamp(400),
          state: 'alternative',
        },
        knexTransaction
      )
      expect(getL2TransactionTimestampMockFn).toHaveBeenExhausted()
    })

    it('should throw error if there is no state update in db for given stateUpdateId', async () => {
      const stateUpdateId = 1
      const knexTransaction = mockObject<Knex.Transaction>()
      const mockStateUpdateRepository = mockObject<StateUpdateRepository>({
        findById: mockFn().resolvesTo(undefined),
      })
      const feederGatewayCollector = new FeederGatewayCollector(
        mockObject<FeederGatewayClient>(),
        mockObject<L2TransactionRepository>(),
        mockStateUpdateRepository,
        Logger.SILENT,
        true
      )

      await expect(
        feederGatewayCollector.collectForStateUpdate(
          stateUpdateId,
          knexTransaction
        )
      ).toBeRejectedWith(`State update ${stateUpdateId} not found`)
      expect(mockStateUpdateRepository.findById).toHaveBeenOnlyCalledWith(
        stateUpdateId,
        knexTransaction
      )
    })

    it('should stop collecting transactions if there is no batch data', async () => {
      const stateUpdateId = 1
      const knexTransaction = mockObject<Knex.Transaction>()
      const mockL2TransactionRepository = mockObject<L2TransactionRepository>({
        getTimestampsGroupedByTransactionId: mockFn(),
      })
      const feederGatewayCollector = new FeederGatewayCollector(
        mockObject<FeederGatewayClient>({
          getPerpetualBatchInfo: mockFn().resolvesTo(undefined),
        }),
        mockL2TransactionRepository,
        mockObject<StateUpdateRepository>({
          findById: mockFn().resolvesTo({} as StateUpdateRecord),
        }),
        Logger.SILENT,
        true
      )

      await feederGatewayCollector.collectForStateUpdate(
        stateUpdateId,
        knexTransaction
      )

      expect(
        mockL2TransactionRepository.getTimestampsGroupedByTransactionId
      ).not.toHaveBeenCalled()
    })
  })

  describe(
    FeederGatewayCollector.prototype.getL2TransactionTimestamp.name,
    () => {
      const feederGatewayCollector = new FeederGatewayCollector(
        mockObject<FeederGatewayClient>(),
        mockObject<L2TransactionRepository>(),
        mockObject<StateUpdateRepository>(),
        Logger.SILENT,
        mockObject<boolean>()
      )

      it('should return timestamp from timestampsGroupedByTransactionId if it exists', () => {
        const timestampsGroupedByTransactionId = {
          1: [Timestamp(100), Timestamp(200)],
        }
        const transactionId = 1
        const fallbackTimestamp = Timestamp(300)

        const timestamp = feederGatewayCollector.getL2TransactionTimestamp(
          timestampsGroupedByTransactionId,
          transactionId,
          fallbackTimestamp
        )

        expect(timestamp).toEqual(Timestamp(100))
      })

      it('should return fallbackTimestamp if there is no timestamp in timestampsGroupedByTransactionId', () => {
        const timestampsGroupedByTransactionId = {
          1: [Timestamp(100), Timestamp(200)],
        }
        const transactionId = 2
        const fallbackTimestamp = Timestamp(300)

        const timestamp = feederGatewayCollector.getL2TransactionTimestamp(
          timestampsGroupedByTransactionId,
          transactionId,
          fallbackTimestamp
        )

        expect(timestamp).toEqual(fallbackTimestamp)
      })

      it('should return timestamp from timestampsGroupedByTransactionId at given index if it exists', () => {
        const timestampsGroupedByTransactionId = {
          1: [Timestamp(100), Timestamp(200)],
        }
        const transactionId = 1
        const fallbackTimestamp = Timestamp(300)
        const index = 1

        const timestamp = feederGatewayCollector.getL2TransactionTimestamp(
          timestampsGroupedByTransactionId,
          transactionId,
          fallbackTimestamp,
          index
        )

        expect(timestamp).toEqual(Timestamp(200))
      })

      it('should return last timestamp if there is no timestamp in timestampsGroupedByTransactionId at given index', () => {
        const timestampsGroupedByTransactionId = {
          1: [Timestamp(100), Timestamp(200)],
        }
        const transactionId = 1
        const fallbackTimestamp = Timestamp(300)
        const index = 3

        const timestamp = feederGatewayCollector.getL2TransactionTimestamp(
          timestampsGroupedByTransactionId,
          transactionId,
          fallbackTimestamp,
          index
        )

        expect(timestamp).toEqual(Timestamp(200))
      })
    }
  )

  describe(FeederGatewayCollector.prototype.discardAfter.name, () => {
    const mockedL2TransactionRepository = mockObject<L2TransactionRepository>({
      removeStateUpdateIdAfterBlock: mockFn().resolvesTo(1),
    })
    const feederGatewayCollector = new FeederGatewayCollector(
      mockObject<FeederGatewayClient>(),
      mockedL2TransactionRepository,
      mockObject<StateUpdateRepository>(),
      Logger.SILENT,
      mockObject<boolean>()
    )

    it('should discard transactions after given block number', async () => {
      const blockNumber = 1000
      await feederGatewayCollector.discardAfter(blockNumber)

      expect(
        mockedL2TransactionRepository.removeStateUpdateIdAfterBlock
      ).toHaveBeenCalledWith(blockNumber)
    })
  })
})

const fakeStateUpdateRecord = (id: number) =>
  ({
    batchId: id - 1,
    id,
    blockNumber: id + 1000,
  } as StateUpdateRecord)

const fakePerpetualBatchInfo = (batchId: number): PerpetualBatchInfo => {
  return {
    timeCreated: Timestamp(1000 * batchId),
    transactionsInfo: [
      {
        wasReplaced: false,
        originalTransactionId: 2 * batchId + 1,
        originalTransaction: {
          type: 'Deposit',
          starkKey: StarkKey.fake(`1${batchId}`),
          positionId: 1234n,
          amount: 5000n,
        },
      },
      {
        wasReplaced: false,
        originalTransactionId: 2 * batchId + 2,
        originalTransaction: {
          positionId: 1234n,
          starkKey: StarkKey.fake(`2${batchId}`),
          ethereumAddress: EthereumAddress.fake(`3${batchId}`),
          amount: 12345n,
          nonce: 10n,
          expirationTimestamp: Timestamp(1234),
          signature: {
            r: Hash256.fake(`4${batchId}`),
            s: Hash256.fake(`5${batchId}`),
          },
          type: 'WithdrawalToAddress',
        },
        alternativeTransactions: [
          {
            type: 'Deposit',
            starkKey: StarkKey.fake(`6${batchId}`),
            positionId: 1234n,
            amount: 5000n,
          },
          {
            type: 'Deposit',
            starkKey: StarkKey.fake(`7${batchId}`),
            positionId: 1234n,
            amount: 5000n,
          },
        ],
      },
    ],
  } as PerpetualBatchInfo
}
