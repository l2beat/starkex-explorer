import { Hash256, Timestamp } from '@explorer/types'
import { expect, mockObject } from 'earl'
import { providers } from 'ethers'

import { SentTransactionRepository } from '../peripherals/database/transactions/SentTransactionRepository'
import { EthereumClient } from '../peripherals/ethereum/EthereumClient'
import { Logger } from '../tools/Logger'
import { TransactionStatusService } from './TransactionStatusService'

describe(TransactionStatusService.name, () => {
  it('marks a transaction as mined', async () => {
    const hash = Hash256.fake()
    let updated = false
    const sentTransactionRepository = mockObject<SentTransactionRepository>({
      async updateMined(_hash, mined) {
        updated = true
        expect(_hash).toEqual(hash)
        expect(mined).toEqual({
          blockNumber: 10,
          timestamp: Timestamp(1234000),
          reverted: false,
        })
        return 1
      },
    })
    const ethereumClient = mockObject<EthereumClient>({
      async getTransaction(_hash) {
        expect(_hash).toEqual(hash)
        return {} as providers.TransactionResponse
      },
      async getTransactionReceipt(_hash) {
        expect(_hash).toEqual(hash)
        return { blockNumber: 10, status: 1 } as providers.TransactionReceipt
      },
      async getBlock(_blockNumber) {
        expect(_blockNumber).toEqual(10)
        return { timestamp: 1234 } as providers.Block
      },
    })
    const service = new TransactionStatusService(
      sentTransactionRepository,
      ethereumClient,
      Logger.SILENT
    )
    await service.checkTransaction(hash)
    expect(updated).toEqual(true)
  })

  it('marks a transaction as reverted', async () => {
    const hash = Hash256.fake()
    let updated = false
    const sentTransactionRepository = mockObject<SentTransactionRepository>({
      async updateMined(_hash, mined) {
        updated = true
        expect(_hash).toEqual(hash)
        expect(mined).toEqual({
          blockNumber: 10,
          timestamp: Timestamp(1234000),
          reverted: true,
        })
        return 1
      },
    })
    const ethereumClient = mockObject<EthereumClient>({
      async getTransaction(_hash) {
        expect(_hash).toEqual(hash)
        return {} as providers.TransactionResponse
      },
      async getTransactionReceipt(_hash) {
        expect(_hash).toEqual(hash)
        return { blockNumber: 10, status: 0 } as providers.TransactionReceipt
      },
      async getBlock(_blockNumber) {
        expect(_blockNumber).toEqual(10)
        return { timestamp: 1234 } as providers.Block
      },
    })
    const service = new TransactionStatusService(
      sentTransactionRepository,
      ethereumClient,
      Logger.SILENT
    )
    await service.checkTransaction(hash)
    expect(updated).toEqual(true)
  })

  it('removes a transaction after a specified number of checks', async () => {
    const hash = Hash256.fake()
    let removed = false
    const sentTransactionRepository = mockObject<SentTransactionRepository>({
      async deleteByTransactionHash(_hash) {
        removed = true
        expect(_hash).toEqual(hash)
        return 1
      },
    })
    const ethereumClient = mockObject<EthereumClient>({
      async getTransaction(_hash) {
        expect(_hash).toEqual(hash)
        return undefined
      },
    })
    const service = new TransactionStatusService(
      sentTransactionRepository,
      ethereumClient,
      Logger.SILENT,
      { maxMissingBeforeDelete: 3 }
    )

    await service.checkTransaction(hash)
    await service.checkTransaction(hash)
    expect(removed).toEqual(false)
    await service.checkTransaction(hash)
    expect(removed).toEqual(true)
  })
})
