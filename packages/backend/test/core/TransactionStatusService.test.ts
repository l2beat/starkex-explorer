import { Hash256, Timestamp } from '@explorer/types'
import { expect } from 'earljs'
import { ethers } from 'ethers'

import {
  applyCheckResult,
  TransactionStatusService,
} from '../../src/core/TransactionStatusService'
import { TransactionStatusRepository } from '../../src/peripherals/database/TransactionStatusRepository'
import { EthereumClient } from '../../src/peripherals/ethereum/EthereumClient'
import { Logger } from '../../src/tools/Logger'
import { fakeSentTransaction } from '../fakes'
import { mock } from '../mock'

describe(TransactionStatusService.name, () => {
  describe(applyCheckResult.name, () => {
    it('handles mined', async () => {
      const transaction = fakeSentTransaction()
      const minedAt = Timestamp(+transaction.sentAt + 1)
      const blockNumber = 1
      const result = applyCheckResult(transaction, {
        status: 'mined',
        minedAt,
        blockNumber,
      })
      expect(result).toEqual({
        ...transaction,
        mined: {
          at: minedAt,
          blockNumber,
        },
      })
    })

    it('handles reverted', async () => {
      const transaction = fakeSentTransaction()
      const nowMillis = +transaction.sentAt + 1
      const result = applyCheckResult(
        transaction,
        {
          status: 'reverted',
        },
        () => nowMillis
      )
      expect(result).toEqual({
        ...transaction,
        revertedAt: Timestamp(nowMillis),
      })
    })

    it('handles initial not found', async () => {
      const transaction = fakeSentTransaction({ notFoundRetries: 1 })
      const result = applyCheckResult(transaction, {
        status: 'not found',
      })
      expect(result).toEqual({
        ...transaction,
        notFoundRetries: 0,
      })
    })

    it('handles forgotten', async () => {
      const transaction = fakeSentTransaction({ notFoundRetries: 0 })
      const nowMillis = +transaction.sentAt + 1
      const result = applyCheckResult(
        transaction,
        {
          status: 'not found',
        },
        () => nowMillis
      )
      expect(result).toEqual({
        ...transaction,
        forgottenAt: Timestamp(nowMillis),
      })
    })
  })

  describe(TransactionStatusService.prototype.checkTransaction.name, () => {
    it('returns not found', async () => {
      const service = new TransactionStatusService(
        mock<TransactionStatusRepository>(),
        mock<EthereumClient>({ getTransaction: async () => undefined }),
        Logger.SILENT
      )
      const result = await service.checkTransaction(Hash256.fake())
      expect(result).toEqual({
        status: 'not found',
      })
    })
    it('returns reverted', async () => {
      const service = new TransactionStatusService(
        mock<TransactionStatusRepository>({}),
        mock<EthereumClient>({
          getTransaction: async () => {
            return {} as ethers.providers.TransactionResponse
          },
          getTransactionReceipt: async () => {
            return { status: 0 } as ethers.providers.TransactionReceipt
          },
        }),
        Logger.SILENT
      )
      const result = await service.checkTransaction(Hash256.fake())
      expect(result).toEqual({
        status: 'reverted',
      })
    })
    it('returns mined', async () => {
      const blockNumber = 1
      const timestampInSeconds = 1
      const service = new TransactionStatusService(
        mock<TransactionStatusRepository>({}),
        mock<EthereumClient>({
          getTransaction: async () => {
            return {} as ethers.providers.TransactionResponse
          },
          getTransactionReceipt: async () => {
            return {
              status: 1,
              blockNumber,
            } as ethers.providers.TransactionReceipt
          },
          getBlock: async () => {
            return { timestamp: timestampInSeconds } as ethers.providers.Block
          },
        }),
        Logger.SILENT
      )
      const result = await service.checkTransaction(Hash256.fake())
      expect(result).toEqual({
        status: 'mined',
        minedAt: Timestamp.fromSeconds(timestampInSeconds),
        blockNumber,
      })
    })
  })
})
