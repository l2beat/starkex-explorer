import { EthereumAddress, Hash256, StarkKey, Timestamp } from '@explorer/types'
import { expect, mockFn, mockObject } from 'earl'
import { Knex } from 'knex'

import { L2TransactionRepository } from '../../peripherals/database/L2TransactionRepository'
import {
  StateUpdateRecord,
  StateUpdateRepository,
} from '../../peripherals/database/StateUpdateRepository'
import { FeederGatewayClient } from '../../peripherals/starkware/FeederGatewayClient'
import { PerpetualBatchInfo } from '../../peripherals/starkware/toPerpetualBatchInfo'
import { Logger } from '../../tools/Logger'
import { FeederGatewayCollector } from './FeederGatewayCollector'

describe(FeederGatewayCollector.name, () => {
  describe(FeederGatewayCollector.prototype.collect.name, () => {
    it('should collect transactions from scratch if no transactions were synced before', async () => {
      const mockFeederGatewayClient = mockObject<FeederGatewayClient>({
        getPerpetualBatchInfo: mockFn(async (batchId: number) => {
          return {
            transactionsInfo: fakeTransactionsInfo(batchId),
          } as PerpetualBatchInfo
        }),
      })
      const knexTransaction = mockObject<Knex.Transaction>({})
      const mockL2TransactionRepository = mockObject<L2TransactionRepository>({
        findLatestStateUpdateId: mockFn().resolvesTo(undefined),
        add: mockFn().resolvesTo(1),
        runInTransactionWithLockedTable: mockFn(
          async (fun: (trx: Knex.Transaction) => Promise<void>) => {
            await fun(knexTransaction)
          }
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
        Logger.SILENT
      )

      await feederGatewayCollector.collect()

      expect(mockStateUpdateRepository.findLast).toHaveBeenCalledTimes(1)
      expect(
        mockL2TransactionRepository.findLatestStateUpdateId
      ).toHaveBeenCalledTimes(1)
      expect(
        mockL2TransactionRepository.runInTransactionWithLockedTable
      ).toHaveBeenCalledTimes(5)
      for (const i of [1, 2, 3, 4, 5]) {
        expect(mockStateUpdateRepository.findById).toHaveBeenNthCalledWith(i, i)
        const stateUpdate = fakeStateUpdateRecord(i)
        expect(
          mockL2TransactionRepository.deleteByTransactionIds
        ).toHaveBeenNthCalledWith(
          i,
          [(i - 1) * 2 + 1, (i - 1) * 2 + 2],
          knexTransaction
        )
        expect(
          mockFeederGatewayClient.getPerpetualBatchInfo
        ).toHaveBeenNthCalledWith(i, stateUpdate.batchId)
        const transactionsInfo = fakeTransactionsInfo(stateUpdate.batchId)
        expect(mockL2TransactionRepository.add).toHaveBeenNthCalledWith(
          4 * (i - 1) + 1,
          {
            stateUpdateId: stateUpdate.id,
            blockNumber: stateUpdate.blockNumber,
            transactionId: transactionsInfo[0]!.originalTransactionId,
            data: transactionsInfo[0]!.originalTransaction,
          },
          knexTransaction
        )
        expect(mockL2TransactionRepository.add).toHaveBeenNthCalledWith(
          4 * (i - 1) + 2,
          {
            stateUpdateId: stateUpdate.id,
            blockNumber: stateUpdate.blockNumber,
            transactionId: transactionsInfo[1]!.originalTransactionId,
            data: transactionsInfo[1]!.originalTransaction,
          },
          knexTransaction
        )
        expect(mockL2TransactionRepository.add).toHaveBeenNthCalledWith(
          4 * (i - 1) + 3,
          {
            stateUpdateId: stateUpdate.id,
            blockNumber: stateUpdate.blockNumber,
            transactionId: transactionsInfo[1]!.originalTransactionId,
            data: transactionsInfo[1]!.alternativeTransactions![0]!,
          },
          knexTransaction
        )
        expect(mockL2TransactionRepository.add).toHaveBeenNthCalledWith(
          4 * (i - 1) + 4,
          {
            stateUpdateId: stateUpdate.id,
            blockNumber: stateUpdate.blockNumber,
            transactionId: transactionsInfo[1]!.originalTransactionId,
            data: transactionsInfo[1]!.alternativeTransactions![1]!,
          },
          knexTransaction
        )
      }
      expect(
        mockL2TransactionRepository.findLatestStateUpdateId
      ).toHaveBeenExhausted()
      expect(mockStateUpdateRepository.findById).toHaveBeenExhausted()
      expect(mockL2TransactionRepository.add).toHaveBeenExhausted()
    })

    it('should collect transactions from last state update if some transactions were synced before', async () => {
      const mockFeederGatewayClient = mockObject<FeederGatewayClient>({
        getPerpetualBatchInfo: mockFn(async (batchId: number) => {
          return {
            transactionsInfo: fakeTransactionsInfo(batchId),
          } as PerpetualBatchInfo
        }),
      })
      const knexTransaction = mockObject<Knex.Transaction>({})
      const mockL2TransactionRepository = mockObject<L2TransactionRepository>({
        findLatestStateUpdateId: mockFn().resolvesTo(6),
        add: mockFn().resolvesTo(1),
        runInTransactionWithLockedTable: mockFn(
          async (fun: (trx: Knex.Transaction) => Promise<void>) => {
            await fun(knexTransaction)
          }
        ),
        deleteByTransactionIds: mockFn().resolvesTo(0),
      })
      const mockStateUpdateRepository = mockObject<StateUpdateRepository>({
        findById: mockFn(async (id: number) => fakeStateUpdateRecord(id)),
        findLast: mockFn().resolvesTo(fakeStateUpdateRecord(10)),
      })
      const feederGatewayCollector = new FeederGatewayCollector(
        mockFeederGatewayClient,
        mockL2TransactionRepository,
        mockStateUpdateRepository,
        Logger.SILENT
      )

      await feederGatewayCollector.collect()

      expect(mockStateUpdateRepository.findLast).toHaveBeenCalledTimes(1)
      expect(
        mockL2TransactionRepository.findLatestStateUpdateId
      ).toHaveBeenCalledTimes(1)

      expect(
        mockL2TransactionRepository.runInTransactionWithLockedTable
      ).toHaveBeenCalledTimes(4)

      for (const i of [7, 8, 9, 10]) {
        expect(mockStateUpdateRepository.findById).toHaveBeenNthCalledWith(
          i - 6,
          i
        )
        const stateUpdate = fakeStateUpdateRecord(i)
        expect(
          mockL2TransactionRepository.deleteByTransactionIds
        ).toHaveBeenNthCalledWith(
          i - 6,
          [(i - 1) * 2 + 1, (i - 1) * 2 + 2],
          knexTransaction
        )
        expect(
          mockFeederGatewayClient.getPerpetualBatchInfo
        ).toHaveBeenNthCalledWith(i - 6, stateUpdate.batchId)
        const transactionsInfo = fakeTransactionsInfo(stateUpdate.batchId)
        expect(mockL2TransactionRepository.add).toHaveBeenNthCalledWith(
          4 * (i - 7) + 1,
          {
            stateUpdateId: stateUpdate.id,
            blockNumber: stateUpdate.blockNumber,
            transactionId: transactionsInfo[0]!.originalTransactionId,
            data: transactionsInfo[0]!.originalTransaction,
          },
          knexTransaction
        )
        expect(mockL2TransactionRepository.add).toHaveBeenNthCalledWith(
          4 * (i - 7) + 2,
          {
            stateUpdateId: stateUpdate.id,
            blockNumber: stateUpdate.blockNumber,
            transactionId: transactionsInfo[1]!.originalTransactionId,
            data: transactionsInfo[1]!.originalTransaction,
          },
          knexTransaction
        )
        expect(mockL2TransactionRepository.add).toHaveBeenNthCalledWith(
          4 * (i - 7) + 3,
          {
            stateUpdateId: stateUpdate.id,
            blockNumber: stateUpdate.blockNumber,
            transactionId: transactionsInfo[1]!.originalTransactionId,
            data: transactionsInfo[1]!.alternativeTransactions![0]!,
          },
          knexTransaction
        )
        expect(mockL2TransactionRepository.add).toHaveBeenNthCalledWith(
          4 * (i - 7) + 4,
          {
            stateUpdateId: stateUpdate.id,
            blockNumber: stateUpdate.blockNumber,
            transactionId: transactionsInfo[1]!.originalTransactionId,
            data: transactionsInfo[1]!.alternativeTransactions![1]!,
          },
          knexTransaction
        )
      }
      expect(
        mockL2TransactionRepository.findLatestStateUpdateId
      ).toHaveBeenExhausted()
      expect(mockStateUpdateRepository.findById).toHaveBeenExhausted()
      expect(mockL2TransactionRepository.add).toHaveBeenExhausted()
    })

    it('should stop collecting transactions if there is no batch data', async () => {
      const mockedL2TransactionRepository = mockObject<L2TransactionRepository>(
        {
          findLatestStateUpdateId: mockFn().resolvesTo(undefined),
          add: mockFn(),
        }
      )
      const feederGatewayCollector = new FeederGatewayCollector(
        mockObject<FeederGatewayClient>({
          getPerpetualBatchInfo: mockFn().resolvesTo(undefined),
        }),
        mockedL2TransactionRepository,
        mockObject<StateUpdateRepository>({
          findById: mockFn().resolvesTo({} as StateUpdateRecord),
          findLast: mockFn().resolvesTo(fakeStateUpdateRecord(10)),
        }),
        Logger.SILENT
      )

      await feederGatewayCollector.collect()

      expect(mockedL2TransactionRepository.add).not.toHaveBeenCalled()
    })

    it('should stop collecting transactions if there is no state update in db', async () => {
      const mockedL2TransactionRepository = mockObject<L2TransactionRepository>(
        {
          findLatestStateUpdateId: mockFn(),
          add: mockFn(),
        }
      )
      const mockedStateUpdateRepository = mockObject<StateUpdateRepository>({
        findLast: mockFn().resolvesTo(undefined),
      })
      const feederGatewayCollector = new FeederGatewayCollector(
        mockObject<FeederGatewayClient>(),
        mockedL2TransactionRepository,
        mockedStateUpdateRepository,
        Logger.SILENT
      )

      await feederGatewayCollector.collect()

      expect(
        mockedL2TransactionRepository.findLatestStateUpdateId
      ).not.toHaveBeenCalled()
      expect(mockedL2TransactionRepository.add).not.toHaveBeenCalled()
    })
  })

  it('should throw error if there is no state update in db for given stateUpdateId', async () => {
    const mockedL2TransactionRepository = mockObject<L2TransactionRepository>({
      findLatestStateUpdateId: mockFn().resolvesTo(5),
      add: mockFn(),
    })
    const feederGatewayCollector = new FeederGatewayCollector(
      mockObject<FeederGatewayClient>(),
      mockedL2TransactionRepository,
      mockObject<StateUpdateRepository>({
        findById: mockFn().resolvesTo(undefined),
        findLast: mockFn().resolvesTo(fakeStateUpdateRecord(10)),
      }),
      Logger.SILENT
    )

    await expect(feederGatewayCollector.collect()).toBeRejectedWith(
      `State update 6 not found`
    )
    expect(mockedL2TransactionRepository.add).not.toHaveBeenCalled()
  })

  describe(FeederGatewayCollector.prototype.discardAfter.name, () => {
    const mockedL2TransactionRepository = mockObject<L2TransactionRepository>({
      deleteAfterBlock: mockFn().resolvesTo(1),
    })
    const feederGatewayCollector = new FeederGatewayCollector(
      mockObject<FeederGatewayClient>(),
      mockedL2TransactionRepository,
      mockObject<StateUpdateRepository>(),
      Logger.SILENT
    )

    it('should discard transactions after given block number', async () => {
      const blockNumber = 1000
      await feederGatewayCollector.discardAfter(blockNumber)

      expect(
        mockedL2TransactionRepository.deleteAfterBlock
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

const fakeTransactionsInfo = (
  batchId: number
): PerpetualBatchInfo['transactionsInfo'] => {
  return [
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
  ] as PerpetualBatchInfo['transactionsInfo']
}
