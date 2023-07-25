import {
  PerpetualL2MultiTransactionData,
  PerpetualL2TransactionData,
} from '@explorer/shared'
import { EthereumAddress, Hash256, StarkKey, Timestamp } from '@explorer/types'
import { Logger } from '@l2beat/backend-tools'
import { expect } from 'earl'
import { it } from 'mocha'

import { setupDatabaseTestSuite } from '../../test/database'
import { L2TransactionRepository } from './L2TransactionRepository'

const genericLiveMultiTransaction = (
  transactions: PerpetualL2TransactionData[]
) => ({
  transactionId: 1234,
  data: {
    type: 'MultiTransaction',
    transactions,
  } as PerpetualL2MultiTransactionData,
})

const genericMultiTransaction = (
  transactions: PerpetualL2TransactionData[]
) => ({
  ...genericLiveMultiTransaction(transactions),
  stateUpdateId: 1,
  blockNumber: 12345,
  state: undefined,
})

const genericLiveDepositTransaction = {
  transactionId: 1234,
  data: {
    type: 'Deposit',
    starkKey: StarkKey.fake(),
    positionId: 1234n,
    amount: 5000n,
  },
} as const

const genericDepositTransaction = {
  ...genericLiveDepositTransaction,
  stateUpdateId: 1,
  blockNumber: 12345,
  state: undefined,
} as const

const genericLiveWithdrawalToAddressTransaction = {
  transactionId: 1234,
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

const genericWithdrawalToAddressTransaction = {
  ...genericLiveWithdrawalToAddressTransaction,
  stateUpdateId: 1,
  blockNumber: 12345,
  state: undefined,
} as const

describe(L2TransactionRepository.name, () => {
  const { database } = setupDatabaseTestSuite()

  const repository = new L2TransactionRepository(database, Logger.SILENT)

  afterEach(() => repository.deleteAll())

  describe(
    L2TransactionRepository.prototype.addFeederGatewayTransaction.name,
    () => {
      it('can add a transaction', async () => {
        const id = await repository.addFeederGatewayTransaction(
          genericDepositTransaction
        )

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

      it('can add a transaction as replaced', async () => {
        const id = await repository.addFeederGatewayTransaction({
          ...genericDepositTransaction,
          state: 'replaced',
        })

        const transaction = await repository.findById(id)

        expect(transaction).toEqual({
          id,
          stateUpdateId: genericDepositTransaction.stateUpdateId,
          transactionId: genericDepositTransaction.transactionId,
          blockNumber: genericDepositTransaction.blockNumber,
          starkKeyA: genericDepositTransaction.data.starkKey,
          starkKeyB: undefined,
          data: genericDepositTransaction.data,
          state: 'replaced',
          parentId: undefined,
        })
      })

      it('can add a transaction as alternative', async () => {
        await repository.addFeederGatewayTransaction({
          ...genericDepositTransaction,
          state: 'replaced',
        })

        const id = await repository.addFeederGatewayTransaction({
          ...genericDepositTransaction,
          state: 'alternative',
        })

        const transaction = await repository.findById(id)

        expect(transaction).toEqual({
          id,
          stateUpdateId: genericDepositTransaction.stateUpdateId,
          transactionId: genericDepositTransaction.transactionId,
          blockNumber: genericDepositTransaction.blockNumber,
          starkKeyA: genericDepositTransaction.data.starkKey,
          starkKeyB: undefined,
          data: genericDepositTransaction.data,
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

        const id = await repository.addFeederGatewayTransaction(record)

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

      it("fails if transaction already exists and it's not an alternative", async () => {
        await repository.addFeederGatewayTransaction(genericDepositTransaction)
        await expect(
          repository.addFeederGatewayTransaction(genericDepositTransaction)
        ).toBeRejectedWith(
          'L2 Transaction already exists when adding from Feeder Gatway'
        )
      })

      it('fails if adding alternative without original replaced', async () => {
        await expect(
          repository.addFeederGatewayTransaction({
            ...genericDepositTransaction,
            state: 'alternative',
          } as const)
        ).toBeRejectedWith(
          'L2 Transaction does not exist when adding alternative'
        )
      })

      it('fails if adding alternative but original is not replaced', async () => {
        await repository.addFeederGatewayTransaction(genericDepositTransaction)
        await expect(
          repository.addFeederGatewayTransaction({
            ...genericDepositTransaction,
            state: 'alternative',
          } as const)
        ).toBeRejectedWith(
          'L2 Transaction should be "replaced" when adding alternative'
        )
      })
    }
  )

  describe(L2TransactionRepository.prototype.addLiveTransaction.name, () => {
    it('can add transaction as alternative if transaction with the same transaction id already exists', async () => {
      const record = genericLiveDepositTransaction
      const alternativeRecord = {
        ...genericLiveDepositTransaction,
        data: { ...genericLiveDepositTransaction.data, positionId: 12345n },
      } as const
      const id = await repository.addLiveTransaction(record)

      const transaction = await repository.findById(id)

      expect(transaction).toEqual({
        id,
        stateUpdateId: undefined,
        transactionId: record.transactionId,
        blockNumber: undefined,
        starkKeyA: record.data.starkKey,
        starkKeyB: undefined,
        data: record.data,
        state: undefined,
        parentId: undefined,
      })

      const altId = await repository.addLiveTransaction(alternativeRecord)

      const transactionAfterAlternative = await repository.findById(id)
      const altTransaction = await repository.findById(altId)

      expect(transactionAfterAlternative).toEqual({
        id,
        stateUpdateId: undefined,
        transactionId: record.transactionId,
        blockNumber: undefined,
        starkKeyA: record.data.starkKey,
        starkKeyB: undefined,
        data: record.data,
        state: 'replaced',
        parentId: undefined,
      })

      expect(altTransaction).toEqual({
        id: altId,
        stateUpdateId: undefined,
        transactionId: alternativeRecord.transactionId,
        blockNumber: undefined,
        starkKeyA: alternativeRecord.data.starkKey,
        starkKeyB: undefined,
        data: alternativeRecord.data,
        state: 'alternative',
        parentId: undefined,
      })
    })

    it('does not add transaction if transaction with the same transaction id already exists and is included', async () => {
      await repository.addFeederGatewayTransaction(genericDepositTransaction)

      const id = await repository.addLiveTransaction(
        genericLiveDepositTransaction
      )

      const transaction = await repository.findById(id)
      expect(id).toEqual(0)
      expect(transaction?.stateUpdateId).toBeNullish()
    })
  })

  describe(L2TransactionRepository.prototype.starkKeyExists.name, () => {
    it("returns false if user doesn't exist", async () => {
      expect(await repository.starkKeyExists(StarkKey.fake())).toEqual(false)
    })

    it('returns true if user exists', async () => {
      await repository.addFeederGatewayTransaction(genericDepositTransaction)

      expect(
        await repository.starkKeyExists(genericDepositTransaction.data.starkKey)
      ).toEqual(true)
    })
  })
})
