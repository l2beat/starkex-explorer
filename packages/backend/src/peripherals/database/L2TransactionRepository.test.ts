import {
  PerpetualL2MultiTransactionData,
  PerpetualL2TransactionData,
} from '@explorer/shared'
import {
  AssetHash,
  AssetId,
  EthereumAddress,
  Hash256,
  StarkKey,
  Timestamp,
} from '@explorer/types'
import { Logger } from '@l2beat/backend-tools'
import { expect } from 'earl'
import uniq from 'lodash/uniq'
import { beforeEach, it } from 'mocha'

import { L2TransactionTypesToExclude } from '../../config/starkex/StarkexConfig'
import { setupDatabaseTestSuite } from '../../test/database'
import { L2TransactionRepository } from './L2TransactionRepository'

const genericMultiTransaction = (
  transactions: PerpetualL2TransactionData[]
) => ({
  stateUpdateId: 1,
  transactionId: 1234,
  blockNumber: 12345,
  data: {
    type: 'MultiTransaction',
    transactions,
  } as PerpetualL2MultiTransactionData,
})

const genericDepositTransaction = {
  stateUpdateId: 1,
  transactionId: 1234,
  blockNumber: 12345,
  data: {
    type: 'Deposit',
    starkKey: StarkKey.fake(),
    positionId: 1234n,
    amount: 5000n,
  },
} as const

const genericWithdrawalToAddressTransaction = {
  stateUpdateId: 1,
  transactionId: 1234,
  blockNumber: 12345,
  data: {
    positionId: 1234n,
    starkKey: StarkKey.fake('2'),
    ethereumAddress: EthereumAddress.fake(),
    amount: 12345n,
    nonce: 10n,
    expirationTimestamp: Timestamp(1234),
    signature: {
      r: Hash256.fake(),
      s: Hash256.fake(),
    },
    type: 'WithdrawalToAddress',
  },
} as const

describe(L2TransactionRepository.name, () => {
  const { database } = setupDatabaseTestSuite()

  const repository = new L2TransactionRepository(database, Logger.SILENT)

  afterEach(() => repository.deleteAll())

  describe(`${L2TransactionRepository.prototype.add.name} and ${L2TransactionRepository.prototype.findById.name}`, () => {
    it('can add a transaction', async () => {
      const id = await repository.add(genericDepositTransaction)

      const transaction = await repository.findById(id)

      expect(transaction).toEqual({
        id,
        stateUpdateId: genericDepositTransaction.stateUpdateId,
        transactionId: genericDepositTransaction.transactionId,
        blockNumber: genericDepositTransaction.blockNumber,
        starkKeyA: genericDepositTransaction.data.starkKey,
        starkKeyB: undefined,
        data: genericDepositTransaction.data,
        state: undefined,
        parentId: undefined,
      })
    })

    it('can add an alternative transaction', async () => {
      const record = genericDepositTransaction
      const alternativeRecord = {
        ...genericDepositTransaction,
        data: { ...genericDepositTransaction.data, positionId: 12345n },
      } as const
      const id = await repository.add(record)

      const transaction = await repository.findById(id)

      expect(transaction).toEqual({
        id,
        stateUpdateId: record.stateUpdateId,
        transactionId: record.transactionId,
        blockNumber: record.blockNumber,
        starkKeyA: record.data.starkKey,
        starkKeyB: undefined,
        data: record.data,
        state: undefined,
        parentId: undefined,
      })

      const altId = await repository.add(alternativeRecord)

      const transactionAfterAlternative = await repository.findById(id)
      const altTransaction = await repository.findById(altId)

      expect(transactionAfterAlternative).toEqual({
        id,
        stateUpdateId: record.stateUpdateId,
        transactionId: record.transactionId,
        blockNumber: record.blockNumber,
        starkKeyA: record.data.starkKey,
        starkKeyB: undefined,
        data: record.data,
        state: 'replaced',
        parentId: undefined,
      })

      expect(altTransaction).toEqual({
        id: altId,
        stateUpdateId: alternativeRecord.stateUpdateId,
        transactionId: alternativeRecord.transactionId,
        blockNumber: alternativeRecord.blockNumber,
        starkKeyA: alternativeRecord.data.starkKey,
        starkKeyB: undefined,
        data: alternativeRecord.data,
        state: 'alternative',
        parentId: undefined,
      })
    })

    it('can add a multi transaction', async () => {
      const record = genericMultiTransaction([
        { ...genericDepositTransaction.data, starkKey: StarkKey.fake('1') },
        {
          ...genericWithdrawalToAddressTransaction.data,
          starkKey: StarkKey.fake('2'),
        },
      ])

      const id = await repository.add(record)

      const multiTransaction = await repository.findById(id)
      const firstTransactionOfMulti = await repository.findById(id + 1)
      const secondTransactionOfMulti = await repository.findById(id + 2)
      expect(multiTransaction).toEqual({
        id: id,
        stateUpdateId: record.stateUpdateId,
        transactionId: record.transactionId,
        blockNumber: record.blockNumber,
        state: undefined,
        parentId: undefined,
        starkKeyA: undefined,
        starkKeyB: undefined,
        data: record.data,
      })
      expect(firstTransactionOfMulti).toEqual({
        id: id + 1,
        stateUpdateId: record.stateUpdateId,
        transactionId: record.transactionId,
        blockNumber: record.blockNumber,
        state: undefined,
        parentId: id,
        starkKeyA: StarkKey.fake('1'),
        starkKeyB: undefined,
        data: record.data.transactions[0]!,
      })
      expect(secondTransactionOfMulti).toEqual({
        id: id + 2,
        stateUpdateId: record.stateUpdateId,
        transactionId: record.transactionId,
        blockNumber: record.blockNumber,
        state: undefined,
        parentId: id,
        starkKeyA: StarkKey.fake('2'),
        starkKeyB: undefined,
        data: record.data.transactions[1]!,
      })
    })

    it('can add a multi transaction as an alternative transaction', async () => {
      const record = genericMultiTransaction([
        { ...genericDepositTransaction.data, starkKey: StarkKey.fake('1') },
        {
          ...genericWithdrawalToAddressTransaction.data,
          starkKey: StarkKey.fake('2'),
        },
      ])

      const alternativeRecord = genericMultiTransaction([
        { ...genericDepositTransaction.data, starkKey: StarkKey.fake('3') },
        {
          ...genericWithdrawalToAddressTransaction.data,
          starkKey: StarkKey.fake('4'),
        },
      ])

      const id = await repository.add(record)
      const altId = await repository.add(alternativeRecord)

      const multiAfterAlternative = await repository.findById(id)
      const firstTransactionOfMultiAfterAlternative = await repository.findById(
        id + 1
      )
      const secondTransactionOfMultiAfterAlternative =
        await repository.findById(id + 2)

      expect(multiAfterAlternative).toEqual({
        id: id,
        stateUpdateId: record.stateUpdateId,
        transactionId: record.transactionId,
        blockNumber: record.blockNumber,
        starkKeyA: undefined,
        starkKeyB: undefined,
        data: record.data,
        state: 'replaced',
        parentId: undefined,
      })
      expect(firstTransactionOfMultiAfterAlternative).toEqual({
        id: id + 1,
        stateUpdateId: record.stateUpdateId,
        transactionId: record.transactionId,
        blockNumber: record.blockNumber,
        starkKeyA: StarkKey.fake('1'),
        starkKeyB: undefined,
        data: record.data.transactions[0]!,
        state: 'replaced',
        parentId: id,
      })
      expect(secondTransactionOfMultiAfterAlternative).toEqual({
        id: id + 2,
        stateUpdateId: record.stateUpdateId,
        transactionId: record.transactionId,
        blockNumber: record.blockNumber,
        starkKeyA: StarkKey.fake('2'),
        starkKeyB: undefined,
        data: record.data.transactions[1]!,
        state: 'replaced',
        parentId: id,
      })

      const multiAltTransaction = await repository.findById(altId)
      const firstTransactionOfMultiAlt = await repository.findById(altId + 1)
      const secondTransactionOfMultiAlt = await repository.findById(altId + 2)

      expect(multiAltTransaction).toEqual({
        id: altId,
        stateUpdateId: alternativeRecord.stateUpdateId,
        transactionId: alternativeRecord.transactionId,
        blockNumber: alternativeRecord.blockNumber,
        starkKeyA: undefined,
        starkKeyB: undefined,
        data: alternativeRecord.data,
        state: 'alternative',
        parentId: undefined,
      })

      expect(firstTransactionOfMultiAlt).toEqual({
        id: altId + 1,
        stateUpdateId: alternativeRecord.stateUpdateId,
        transactionId: alternativeRecord.transactionId,
        blockNumber: alternativeRecord.blockNumber,
        starkKeyA: StarkKey.fake('3'),
        starkKeyB: undefined,
        data: alternativeRecord.data.transactions[0]!,
        state: 'alternative',
        parentId: altId,
      })
      expect(secondTransactionOfMultiAlt).toEqual({
        id: altId + 2,
        stateUpdateId: alternativeRecord.stateUpdateId,
        transactionId: alternativeRecord.transactionId,
        blockNumber: alternativeRecord.blockNumber,
        starkKeyA: StarkKey.fake('4'),
        starkKeyB: undefined,
        data: alternativeRecord.data.transactions[1]!,
        state: 'alternative',
        parentId: altId,
      })
    })
  })

  describe(L2TransactionRepository.prototype.countByTransactionId.name, () => {
    it('returns the number of transactions', async () => {
      const record = genericDepositTransaction
      const record2 = {
        ...genericDepositTransaction,
        stateUpdateId: 2,
        blockNumber: 123456,
      }
      await repository.add(record)
      await repository.add(record2)

      const count = await repository.countByTransactionId(record.transactionId)

      expect(count).toEqual(2)
    })

    it('considers multi transactions as a single transaction', async () => {
      await repository.add(
        genericMultiTransaction([
          genericDepositTransaction.data,
          genericWithdrawalToAddressTransaction.data,
        ])
      )
      await repository.add(genericDepositTransaction)

      const count = await repository.countByTransactionId(1234)
      expect(count).toEqual(2)
    })

    it('returns 0 if there are no transactions', async () => {
      const count = await repository.countByTransactionId(1234)

      expect(count).toEqual(0)
    })
  })

  describe(
    L2TransactionRepository.prototype.findAggregatedByTransactionId.name,
    () => {
      it('returns correct object for transaction', async () => {
        const record = genericDepositTransaction

        const id = await repository.add(record)

        const transaction = await repository.findAggregatedByTransactionId(
          record.transactionId
        )

        expect(transaction).toEqual({
          id,
          stateUpdateId: record.stateUpdateId,
          transactionId: record.transactionId,
          blockNumber: record.blockNumber,
          originalTransaction: record.data,
          alternativeTransactions: [],
        })
      })

      it('returns correct object for multi transaction', async () => {
        const record = genericMultiTransaction([
          genericDepositTransaction.data,
          genericWithdrawalToAddressTransaction.data,
        ])

        const id = await repository.add(record)

        const transaction = await repository.findAggregatedByTransactionId(
          record.transactionId
        )

        expect(transaction).toEqual({
          id,
          stateUpdateId: record.stateUpdateId,
          transactionId: record.transactionId,
          blockNumber: record.blockNumber,
          originalTransaction: record.data,
          alternativeTransactions: [],
        })
      })

      it('returns correct object for transaction with alts', async () => {
        const record = genericDepositTransaction
        const alt1 = {
          ...record,
          data: {
            ...record.data,
            amount: 2500n,
          },
        } as const

        const alt2 = genericMultiTransaction([
          genericDepositTransaction.data,
          genericWithdrawalToAddressTransaction.data,
        ])

        const alt3 = {
          ...record,
          data: {
            ...record.data,
            amount: 1000n,
          },
        } as const

        const id = await repository.add(record)
        await repository.add(alt1)
        await repository.add(alt2)
        await repository.add(alt3)

        const transaction = await repository.findAggregatedByTransactionId(
          record.transactionId
        )

        expect(transaction).toEqual({
          id,
          stateUpdateId: record.stateUpdateId,
          transactionId: record.transactionId,
          blockNumber: record.blockNumber,
          originalTransaction: record.data,
          alternativeTransactions: [alt1.data, alt2.data, alt3.data],
        })
      })
    }
  )

  describe(
    L2TransactionRepository.prototype.getPaginatedWithoutMulti.name,
    () => {
      it('respects the limit parameter', async () => {
        const ids = []
        for (let i = 0; i < 10; i++) {
          ids.push(
            await repository.add({
              ...genericDepositTransaction,
              transactionId: 1234 + i,
            })
          )
        }
        const records = await repository.getPaginatedWithoutMulti({
          limit: 5,
          offset: 0,
        })

        expect(records.map((x) => x.id)).toEqual(ids.reverse().slice(0, 5))
      })

      it('respects the offset parameter', async () => {
        const ids = []
        for (let i = 0; i < 10; i++) {
          ids.push(
            await repository.add({
              ...genericDepositTransaction,
              transactionId: 1234 + i,
            })
          )
        }
        const records = await repository.getPaginatedWithoutMulti({
          limit: 5,
          offset: 2,
        })
        expect(records.map((x) => x.id)).toEqual(ids.reverse().slice(2, 5 + 2))
      })

      it('filters out multi transactions', async () => {
        const ids = []

        for (let i = 0; i < 10; i++) {
          ids.push(
            await repository.add({
              ...genericDepositTransaction,
              transactionId: 1234 + i,
            })
          )
        }
        const multiTransaction = genericMultiTransaction([
          genericDepositTransaction.data,
          genericWithdrawalToAddressTransaction.data,
        ])
        const multiId = await repository.add(multiTransaction)
        multiTransaction.data.transactions.forEach((_, index) =>
          ids.push(multiId + index + 1)
        )

        const records = await repository.getPaginatedWithoutMulti({
          limit: 5,
          offset: 0,
        })

        expect(records.map((x) => x.id)).toEqual(ids.reverse().slice(0, 5))
      })

      it('filters out transactions with excluded types', async () => {
        const ids = []
        const excludedTypes = ['Deposit'] as L2TransactionTypesToExclude

        for (let i = 0; i < 10; i++) {
          ids.push(
            await repository.add({
              ...genericDepositTransaction,
              transactionId: 1234 + i,
            })
          )
        }
        const multiTransaction = genericMultiTransaction([
          genericDepositTransaction.data,
          genericWithdrawalToAddressTransaction.data,
        ])
        const multiId = await repository.add(multiTransaction)
        multiTransaction.data.transactions.forEach((_, index) =>
          ids.push(multiId + index + 1)
        )

        const records = await repository.getPaginatedWithoutMulti(
          {
            limit: 100,
            offset: 0,
          },
          excludedTypes
        )

        expect(records.map((x) => x.id)).toEqual(ids.reverse().slice(0, 1))
        expect(uniq(records.map((t) => t.data.type))).not.toEqualUnsorted(
          excludedTypes
        )
      })
    }
  )

  describe(
    L2TransactionRepository.prototype.getUserSpecificPaginated.name,
    () => {
      const starkKey = StarkKey.fake()
      const ids: number[] = []

      beforeEach(async () => {
        for (let i = 0; i < 5; i++) {
          ids.push(
            await repository.add({
              ...genericDepositTransaction,
              transactionId: 1239 + i,
              stateUpdateId: 2,
              data: {
                ...genericDepositTransaction.data,
                starkKey: starkKey,
              },
            })
          )
        }
        for (let i = 0; i < 5; i++) {
          ids.push(
            await repository.add({
              transactionId: 1244 + i,
              stateUpdateId: 3,
              blockNumber: 12345,
              data: {
                type: 'Transfer',
                nonce: 3558046632n,
                amount: 20000000n,
                assetId: AssetHash(
                  '0x00a21edc9d9997b1b1956f542fe95922518a9e28ace11b7b2972a1974bf5971f'
                ),
                signature: {
                  r: Hash256(
                    '0x01c3706776f6f18aa6d05d8d2a87c31e607ccaace868a64991b30b9513aca555'
                  ),
                  s: Hash256(
                    '0x03cbadc127bef81556c214bd4442fae6dead4f7cd140fb3ccebdd537c9c09bdd'
                  ),
                },
                senderStarkKey: StarkKey(
                  '0x0023ad6ee122e6294891270906198ab03ea16a66df5655d062c93ed1ac22be42'
                ),
                receiverStarkKey: starkKey,
                senderPositionId: 337140350554472514n,
                receiverPositionId: 331764625462788454n,
                expirationTimestamp: Timestamp(460858),
              },
            })
          )
        }
        for (let i = 0; i < 5; i++) {
          ids.push(
            await repository.add({
              transactionId: 1234 + i,
              stateUpdateId: 1,
              blockNumber: 12345,
              data: {
                type: 'FundingTick',
                globalFundingIndices: {
                  indices: [
                    {
                      syntheticAssetId: AssetId('BTC-10'),
                      quantizedFundingIndex: 137263953,
                    },
                  ],
                  timestamp: Timestamp(1657926000),
                },
              },
            })
          )
        }
      })

      afterEach(() => {
        ids.splice(0, ids.length)
      })

      it('respects the limit parameter', async () => {
        const records = await repository.getUserSpecificPaginated(
          starkKey,

          {
            limit: 6,
            offset: 0,
          }
        )

        expect(records.map((x) => x.id)).toEqual(ids.slice(4, 10).reverse())
      })

      it('respects the offset parameter', async () => {
        const records = await repository.getUserSpecificPaginated(
          starkKey,

          {
            limit: 6,
            offset: 2,
          }
        )

        expect(records.map((x) => x.id)).toEqual(ids.slice(2, 8).reverse())
      })

      it('filters out transactions with excluded types', async () => {
        const excludedTypes = ['Transfer'] as L2TransactionTypesToExclude

        const records = await repository.getUserSpecificPaginated(
          starkKey,

          {
            limit: 100,
            offset: 0,
          },
          excludedTypes
        )

        expect(records.map((x) => x.id)).toEqual(ids.slice(0, 5).reverse())
        expect(uniq(records.map((t) => t.data.type))).not.toEqualUnsorted(
          excludedTypes
        )
      })
    }
  )

  describe(
    L2TransactionRepository.prototype.getPaginatedWithoutMultiByStateUpdateId
      .name,
    () => {
      it('respects the limit parameter', async () => {
        const ids = []
        for (let i = 0; i < 20; i++) {
          ids.push(
            await repository.add({
              ...genericDepositTransaction,
              transactionId: 1234 + i,
              stateUpdateId: i < 10 ? 1 : 2,
            })
          )
        }
        const records =
          await repository.getPaginatedWithoutMultiByStateUpdateId(1, {
            limit: 5,
            offset: 0,
          })

        expect(records.map((x) => x.id)).toEqual(ids.reverse().slice(10, 15))
      })

      it('respects the offset parameter', async () => {
        const ids = []
        for (let i = 0; i < 20; i++) {
          ids.push(
            await repository.add({
              ...genericDepositTransaction,
              transactionId: 1234 + i,
              stateUpdateId: i < 10 ? 1 : 2,
            })
          )
        }
        const records =
          await repository.getPaginatedWithoutMultiByStateUpdateId(1, {
            limit: 5,
            offset: 2,
          })
        expect(records.map((x) => x.id)).toEqual(ids.reverse().slice(12, 17))
      })

      it('filters out multi transactions', async () => {
        const ids = []

        for (let i = 0; i < 20; i++) {
          ids.push(
            await repository.add({
              ...genericDepositTransaction,
              transactionId: 1234 + i,
              stateUpdateId: i < 10 ? 1 : 2,
            })
          )
        }
        const multiTransaction = {
          ...genericMultiTransaction([
            genericDepositTransaction.data,
            genericWithdrawalToAddressTransaction.data,
          ]),
          transactionId: 1254,
        }
        const multiId = await repository.add(multiTransaction)
        multiTransaction.data.transactions.forEach((_, index) =>
          ids.push(multiId + index + 1)
        )

        const records =
          await repository.getPaginatedWithoutMultiByStateUpdateId(1, {
            limit: 5,
            offset: 0,
          })

        ids.reverse()
        expect(records.map((x) => x.id)).toEqual([
          ...ids.slice(0, 2),
          ...ids.slice(12, 15),
        ])
      })

      it('filters out transactions with excluded types', async () => {
        const ids = []
        const excludedTypes = ['Deposit'] as L2TransactionTypesToExclude

        for (let i = 0; i < 20; i++) {
          ids.push(
            await repository.add({
              ...genericDepositTransaction,
              transactionId: 1234 + i,
              stateUpdateId: i < 10 ? 1 : 2,
            })
          )
        }
        const multiTransaction = {
          ...genericMultiTransaction([
            genericDepositTransaction.data,
            genericWithdrawalToAddressTransaction.data,
          ]),
          transactionId: 1254,
        }
        const multiId = await repository.add(multiTransaction)
        multiTransaction.data.transactions.forEach((_, index) =>
          ids.push(multiId + index + 1)
        )

        const records =
          await repository.getPaginatedWithoutMultiByStateUpdateId(
            1,

            {
              limit: 100,
              offset: 0,
            },
            excludedTypes
          )

        ids.reverse()
        expect(records.map((x) => x.id)).toEqual(ids.slice(0, 1))
        expect(uniq(records.map((t) => t.data.type))).not.toEqualUnsorted(
          excludedTypes
        )
      })
    }
  )

  describe(
    L2TransactionRepository.prototype.findLatestStateUpdateId.name,
    () => {
      it('returns undefined if there are no transactions', async () => {
        const latestStateUpdateId = await repository.findLatestStateUpdateId()

        expect(latestStateUpdateId).toBeNullish()
      })

      it('returns the latest state update id', async () => {
        const latestStateUpdateRecord = {
          ...genericDepositTransaction,
          stateUpdateId: 10,
          transactionId: 12345,
          blockNumber: 123456,
        }
        const record = genericDepositTransaction
        await repository.add(record)
        await repository.add(latestStateUpdateRecord)

        const latestStateUpdateId = await repository.findLatestStateUpdateId()

        expect(latestStateUpdateId).toEqual(
          latestStateUpdateRecord.stateUpdateId
        )
      })
    }
  )

  describe(
    L2TransactionRepository.prototype.findOldestByTransactionId.name,
    () => {
      it('returns undefined if there are no transactions', async () => {
        const transaction = await repository.findOldestByTransactionId(1234)

        expect(transaction).toBeNullish()
      })

      it('returns the oldest transaction', async () => {
        const id = await repository.add(genericDepositTransaction)
        await repository.add({
          ...genericDepositTransaction,
          data: { ...genericDepositTransaction.data, amount: 1000n },
        })

        const transaction = await repository.findOldestByTransactionId(
          genericDepositTransaction.transactionId
        )

        expect(transaction?.id).toEqual(id)
      })
    }
  )

  describe(L2TransactionRepository.prototype.findLatestIncluded.name, () => {
    it('returns undefined if there are no included transactions', async () => {
      await repository.add({
        ...genericDepositTransaction,
        stateUpdateId: undefined,
      })

      const transaction = await repository.findLatestIncluded()

      expect(transaction).toBeNullish()
    })

    it('returns the latest included transaction', async () => {
      const id = await repository.add(genericWithdrawalToAddressTransaction)
      await repository.add({
        ...genericDepositTransaction,
        stateUpdateId: undefined,
      })

      const transaction = await repository.findLatestIncluded()

      expect(transaction?.id).toEqual(id)
    })
  })

  describe(L2TransactionRepository.prototype.getLiveStatistics.name, () => {
    it('returns zeros if there are no transactions', async () => {
      const statistics = await repository.getLiveStatistics()

      expect(statistics).toEqual({
        depositCount: 0,
        withdrawalToAddressCount: 0,
        forcedWithdrawalCount: 0,
        tradeCount: 0,
        forcedTradeCount: 0,
        transferCount: 0,
        conditionalTransferCount: 0,
        liquidateCount: 0,
        deleverageCount: 0,
        fundingTickCount: 0,
        oraclePricesTickCount: 0,
        multiTransactionCount: 0,
        replacedTransactionsCount: 0,
      })
    })

    it('returns correct statistics', async () => {
      await repository.add(genericDepositTransaction)
      await repository.add({
        ...genericDepositTransaction,
        transactionId: 1222,
        stateUpdateId: undefined,
      })
      await repository.add({
        ...genericMultiTransaction([genericDepositTransaction.data]),
        transactionId: 1223,
        stateUpdateId: undefined,
      })
      await repository.add({
        ...genericDepositTransaction,
        transactionId: 1222,
        stateUpdateId: undefined,
      })

      const statistics = await repository.getLiveStatistics()

      expect(statistics).toEqual({
        depositCount: 3,
        withdrawalToAddressCount: 0,
        forcedWithdrawalCount: 0,
        tradeCount: 0,
        forcedTradeCount: 0,
        transferCount: 0,
        conditionalTransferCount: 0,
        liquidateCount: 0,
        deleverageCount: 0,
        fundingTickCount: 0,
        oraclePricesTickCount: 0,
        multiTransactionCount: 1,
        replacedTransactionsCount: 1,
      })
    })
  })

  describe(
    L2TransactionRepository.prototype.getLiveStatisticsByStarkKey.name,
    () => {
      it('returns zeros if there are no transactions', async () => {
        await repository.add(genericDepositTransaction)
        const statistics = await repository.getLiveStatisticsByStarkKey(
          StarkKey.fake()
        )

        expect(statistics).toEqual({
          depositCount: 0,
          withdrawalToAddressCount: 0,
          forcedWithdrawalCount: 0,
          tradeCount: 0,
          forcedTradeCount: 0,
          transferCount: 0,
          conditionalTransferCount: 0,
          liquidateCount: 0,
          deleverageCount: 0,
          fundingTickCount: 0,
          oraclePricesTickCount: 0,
          replacedTransactionsCount: 0,
        })
      })

      it('returns correct statistics', async () => {
        await repository.add(genericDepositTransaction)
        await repository.add({
          ...genericDepositTransaction,
          transactionId: 1292,
          stateUpdateId: undefined,
          data: {
            ...genericDepositTransaction.data,
            starkKey: StarkKey.fake(),
          },
        })
        await repository.add({
          ...genericDepositTransaction,
          transactionId: 1222,
          stateUpdateId: undefined,
        })
        await repository.add({
          ...genericMultiTransaction([genericDepositTransaction.data]),
          transactionId: 1223,
          stateUpdateId: undefined,
        })
        await repository.add({
          ...genericDepositTransaction,
          transactionId: 1222,
          stateUpdateId: undefined,
        })

        const statistics = await repository.getLiveStatisticsByStarkKey(
          genericDepositTransaction.data.starkKey
        )

        expect(statistics).toEqual({
          depositCount: 3,
          withdrawalToAddressCount: 0,
          forcedWithdrawalCount: 0,
          tradeCount: 0,
          forcedTradeCount: 0,
          transferCount: 0,
          conditionalTransferCount: 0,
          liquidateCount: 0,
          deleverageCount: 0,
          fundingTickCount: 0,
          oraclePricesTickCount: 0,
          replacedTransactionsCount: 1,
        })
      })
    }
  )

  describe(
    L2TransactionRepository.prototype.getStatisticsByStateUpdateId.name,
    () => {
      it('returns zeros if there are no transactions', async () => {
        await repository.add({ ...genericDepositTransaction, stateUpdateId: 1 })
        const statistics = await repository.getStatisticsByStateUpdateId(2)

        expect(statistics).toEqual({
          depositCount: 0,
          withdrawalToAddressCount: 0,
          forcedWithdrawalCount: 0,
          tradeCount: 0,
          forcedTradeCount: 0,
          transferCount: 0,
          conditionalTransferCount: 0,
          liquidateCount: 0,
          deleverageCount: 0,
          fundingTickCount: 0,
          oraclePricesTickCount: 0,
          multiTransactionCount: 0,
          replacedTransactionsCount: 0,
        })
      })

      it('returns correct statistics', async () => {
        await repository.add({
          ...genericDepositTransaction,
          transactionId: 1199,
          stateUpdateId: 1,
        })
        await repository.add({ ...genericDepositTransaction, stateUpdateId: 2 })
        await repository.add({ ...genericDepositTransaction, stateUpdateId: 2 })
        await repository.add({
          ...genericMultiTransaction([genericDepositTransaction.data]),
          stateUpdateId: 2,
        })
        await repository.add({
          ...genericDepositTransaction,
          transactionId: 2000,
          stateUpdateId: 2,
        })

        const statistics = await repository.getStatisticsByStateUpdateId(2)

        expect(statistics).toEqual({
          depositCount: 4,
          withdrawalToAddressCount: 0,
          forcedWithdrawalCount: 0,
          tradeCount: 0,
          forcedTradeCount: 0,
          transferCount: 0,
          conditionalTransferCount: 0,
          liquidateCount: 0,
          deleverageCount: 0,
          fundingTickCount: 0,
          oraclePricesTickCount: 0,
          multiTransactionCount: 1,
          replacedTransactionsCount: 1,
        })
      })
    }
  )

  describe(
    L2TransactionRepository.prototype.getStatisticsByStateUpdateIdAndStarkKey
      .name,
    () => {
      it('returns 0 if there are no transactions', async () => {
        await repository.add({ ...genericDepositTransaction, stateUpdateId: 1 })
        const statistics =
          await repository.getStatisticsByStateUpdateIdAndStarkKey(
            2,
            StarkKey.fake()
          )

        expect(statistics).toEqual({
          depositCount: 0,
          withdrawalToAddressCount: 0,
          forcedWithdrawalCount: 0,
          tradeCount: 0,
          forcedTradeCount: 0,
          transferCount: 0,
          conditionalTransferCount: 0,
          liquidateCount: 0,
          deleverageCount: 0,
          fundingTickCount: 0,
          oraclePricesTickCount: 0,
          replacedTransactionsCount: 0,
        })
      })

      it('returns correct statistics', async () => {
        await repository.add({
          ...genericDepositTransaction,
          transactionId: 1199,
          stateUpdateId: 1,
          data: {
            ...genericDepositTransaction.data,
            starkKey: StarkKey.fake(),
          },
        })
        await repository.add({ ...genericDepositTransaction, stateUpdateId: 2 })
        await repository.add({ ...genericDepositTransaction, stateUpdateId: 2 })
        await repository.add({
          ...genericMultiTransaction([genericDepositTransaction.data]),
          stateUpdateId: 2,
        })
        await repository.add({
          ...genericDepositTransaction,
          transactionId: 2000,
          stateUpdateId: 2,
        })

        const statistics =
          await repository.getStatisticsByStateUpdateIdAndStarkKey(
            2,
            genericDepositTransaction.data.starkKey
          )

        expect(statistics).toEqual({
          depositCount: 4,
          withdrawalToAddressCount: 0,
          forcedWithdrawalCount: 0,
          tradeCount: 0,
          forcedTradeCount: 0,
          transferCount: 0,
          conditionalTransferCount: 0,
          liquidateCount: 0,
          deleverageCount: 0,
          fundingTickCount: 0,
          oraclePricesTickCount: 0,
          replacedTransactionsCount: 1,
        })
      })
    }
  )

  describe(L2TransactionRepository.prototype.deleteAfterBlock.name, () => {
    it('deletes transactions after a block', async () => {
      const record = {
        ...genericDepositTransaction,
        stateUpdateId: 1,
        transactionId: 1234,
        blockNumber: 12345,
      }
      const recordToBeDeleted = {
        ...genericDepositTransaction,
        stateUpdateId: 2,
        transactionId: 12345,
        blockNumber: 123456,
      }
      const id = await repository.add(record)
      const deletedId = await repository.add(recordToBeDeleted)

      await repository.deleteAfterBlock(record.blockNumber)

      const transaction = await repository.findById(id)
      const deletedTransaction = await repository.findById(deletedId)

      expect(transaction).not.toBeNullish()
      expect(deletedTransaction).toBeNullish()
    })
  })

  describe(
    L2TransactionRepository.prototype.deleteByTransactionIds.name,
    () => {
      const record = {
        ...genericDepositTransaction,
        stateUpdateId: 1,
        transactionId: 1234,
        blockNumber: 12345,
      }
      const recordToBeDeleted = {
        ...genericDepositTransaction,
        stateUpdateId: 2,
        transactionId: 12345,
        blockNumber: 123456,
        data: {
          type: 'Deposit',
          starkKey: StarkKey.fake(),
          positionId: 1234n,
          amount: 5000n,
        },
      } as const
      it('deletes transactions by transaction ids', async () => {
        const id = await repository.add(record)
        const deletedId = await repository.add(recordToBeDeleted)

        await repository.deleteAfterBlock(record.blockNumber)

        const transaction = await repository.findById(id)
        const deletedTransaction = await repository.findById(deletedId)

        expect(transaction).not.toBeNullish()
        expect(deletedTransaction).toBeNullish()
      })
    }
  )
})
