import { encodeAssetId } from '@explorer/encoding'
import {
  AssetId,
  EthereumAddress,
  Hash256,
  StarkKey,
  Timestamp,
} from '@explorer/types'
import { expect } from 'earljs'
import { BigNumber, providers } from 'ethers'

import { BlockRange } from '../../model'
import {
  UserTransactionAddRecord,
  UserTransactionRepository,
} from '../../peripherals/database/transactions/UserTransactionRepository'
import { EthereumClient } from '../../peripherals/ethereum/EthereumClient'
import { mock } from '../../test/mock'
import {
  LogForcedTradeRequest,
  LogForcedWithdrawalRequest,
  LogFullWithdrawalRequest,
  LogWithdrawalPerformed,
} from './events'
import { UserTransactionCollector } from './UserTransactionCollector'

describe(UserTransactionCollector.name, () => {
  it(`can process ${LogWithdrawalPerformed.name}`, async () => {
    const blockRange = new BlockRange([], 100, 200)
    const starkKey = StarkKey.fake('123')
    const assetType = '0xa1b2'
    const nonQuantizedAmount = 111n
    const quantizedAmount = 222n
    const recipient = EthereumAddress.fake('456')
    const transactionHash = Hash256.fake('abc')
    const perpetualAddress = EthereumAddress.fake('def')

    const ethereumClient = mock<EthereumClient>({
      async getLogsInRange(range, parameters) {
        expect(range).toEqual(blockRange)
        expect(parameters.address).toEqual(perpetualAddress.toString())

        const log = LogWithdrawalPerformed.encodeLog([
          starkKey.toString(),
          assetType,
          BigNumber.from(nonQuantizedAmount),
          BigNumber.from(quantizedAmount),
          recipient.toString(),
        ])
        const fullLog = {
          ...log,
          blockNumber: 150,
          transactionHash: transactionHash.toString(),
        }
        return [fullLog as providers.Log]
      },
      async getBlockTimestamp(blockNumber) {
        expect(blockNumber).toEqual(150)
        return 1234
      },
    })

    let added: UserTransactionAddRecord | undefined
    const userTransactionRepository = mock<UserTransactionRepository>({
      async add(record) {
        added = record
        return 1
      },
    })

    const collector = new UserTransactionCollector(
      ethereumClient,
      userTransactionRepository,
      perpetualAddress
    )

    await collector.collect(blockRange)

    expect(added).toEqual({
      blockNumber: 150,
      transactionHash,
      timestamp: Timestamp(1234000),
      data: {
        type: 'Withdraw',
        starkKey,
        assetType,
        nonQuantizedAmount,
        quantizedAmount,
        recipient,
      },
    })
  })

  it(`can process ${LogForcedWithdrawalRequest.name}`, async () => {
    const blockRange = new BlockRange([], 100, 200)
    const starkKey = StarkKey.fake('123')
    const positionId = 123n
    const quantizedAmount = 456n
    const transactionHash = Hash256.fake('abc')
    const perpetualAddress = EthereumAddress.fake('def')

    const ethereumClient = mock<EthereumClient>({
      async getLogsInRange(range, parameters) {
        expect(range).toEqual(blockRange)
        expect(parameters.address).toEqual(perpetualAddress.toString())

        const log = LogForcedWithdrawalRequest.encodeLog([
          BigNumber.from(starkKey.toString()),
          BigNumber.from(positionId),
          BigNumber.from(quantizedAmount),
        ])
        const fullLog = {
          ...log,
          blockNumber: 150,
          transactionHash: transactionHash.toString(),
        }
        return [fullLog as providers.Log]
      },
      async getBlockTimestamp(blockNumber) {
        expect(blockNumber).toEqual(150)
        return 1234
      },
    })

    let added: UserTransactionAddRecord | undefined
    const userTransactionRepository = mock<UserTransactionRepository>({
      async add(record) {
        added = record
        return 1
      },
    })

    const collector = new UserTransactionCollector(
      ethereumClient,
      userTransactionRepository,
      perpetualAddress
    )

    await collector.collect(blockRange)

    expect(added).toEqual({
      blockNumber: 150,
      transactionHash,
      timestamp: Timestamp(1234000),
      data: {
        type: 'ForcedWithdrawal',
        starkKey,
        positionId,
        quantizedAmount,
      },
    })
  })

  it(`can process ${LogFullWithdrawalRequest.name}`, async () => {
    const blockRange = new BlockRange([], 100, 200)
    const starkKey = StarkKey.fake('123')
    const vaultId = 123n
    const transactionHash = Hash256.fake('abc')
    const starkExAddress = EthereumAddress.fake('def')

    const ethereumClient = mock<EthereumClient>({
      async getLogsInRange(range, parameters) {
        expect(range).toEqual(blockRange)
        expect(parameters.address).toEqual(starkExAddress.toString())

        const log = LogFullWithdrawalRequest.encodeLog([
          BigNumber.from(starkKey.toString()),
          BigNumber.from(vaultId),
        ])
        const fullLog = {
          ...log,
          blockNumber: 150,
          transactionHash: transactionHash.toString(),
        }
        return [fullLog as providers.Log]
      },
      async getBlockTimestamp(blockNumber) {
        expect(blockNumber).toEqual(150)
        return 1234
      },
    })

    let added: UserTransactionAddRecord | undefined
    const userTransactionRepository = mock<UserTransactionRepository>({
      async add(record) {
        added = record
        return 1
      },
    })

    const collector = new UserTransactionCollector(
      ethereumClient,
      userTransactionRepository,
      starkExAddress
    )

    await collector.collect(blockRange)

    expect(added).toEqual({
      blockNumber: 150,
      transactionHash,
      timestamp: Timestamp(1234000),
      data: {
        type: 'FullWithdrawal',
        starkKey,
        vaultId,
      },
    })
  })

  it(`can process ${LogForcedTradeRequest.name}`, async () => {
    const blockRange = new BlockRange([], 100, 200)
    const starkKeyA = StarkKey.fake('aaa')
    const starkKeyB = StarkKey.fake('bbb')
    const positionIdA = 123n
    const positionIdB = 456n
    const collateralAmount = 1000n
    const collateralAssetId = '0xa1b2'
    const syntheticAmount = 2000n
    const syntheticAssetId = AssetId('ETH-9')
    const isABuyingSynthetic = true
    const nonce = 42069n

    const transactionHash = Hash256.fake('abc')
    const perpetualAddress = EthereumAddress.fake('def')

    const ethereumClient = mock<EthereumClient>({
      async getLogsInRange(range, parameters) {
        expect(range).toEqual(blockRange)
        expect(parameters.address).toEqual(perpetualAddress.toString())

        const log = LogForcedTradeRequest.encodeLog([
          BigNumber.from(starkKeyA.toString()),
          BigNumber.from(starkKeyB.toString()),
          BigNumber.from(positionIdA),
          BigNumber.from(positionIdB),
          BigNumber.from(collateralAssetId),
          BigNumber.from('0x' + encodeAssetId(syntheticAssetId)),
          BigNumber.from(collateralAmount),
          BigNumber.from(syntheticAmount),
          isABuyingSynthetic,
          BigNumber.from(nonce),
        ])
        const fullLog = {
          ...log,
          blockNumber: 150,
          transactionHash: transactionHash.toString(),
        }
        return [fullLog as providers.Log]
      },
      async getBlockTimestamp(blockNumber) {
        expect(blockNumber).toEqual(150)
        return 1234
      },
    })

    let added: UserTransactionAddRecord | undefined
    const userTransactionRepository = mock<UserTransactionRepository>({
      async add(record) {
        added = record
        return 1
      },
    })

    const collector = new UserTransactionCollector(
      ethereumClient,
      userTransactionRepository,
      perpetualAddress
    )

    await collector.collect(blockRange)

    expect(added).toEqual({
      blockNumber: 150,
      transactionHash,
      timestamp: Timestamp(1234000),
      data: {
        type: 'ForcedTrade',
        starkKeyA,
        starkKeyB,
        positionIdA,
        positionIdB,
        collateralAmount,
        collateralAssetId: AssetId.USDC,
        syntheticAmount,
        syntheticAssetId,
        isABuyingSynthetic,
        nonce,
      },
    })
  })

  it('can process multiple events', async () => {
    const ethereumClient = mock<EthereumClient>({
      async getLogsInRange() {
        return Array.from({ length: 3 }).map((_, i) => {
          const log = LogForcedWithdrawalRequest.encodeLog([
            BigNumber.from(i),
            BigNumber.from(i),
            BigNumber.from(i),
          ])
          const fullLog = {
            ...log,
            blockNumber: 150,
            transactionHash: Hash256.fake().toString(),
          }
          return fullLog as providers.Log
        })
      },
      async getBlockTimestamp(blockNumber) {
        expect(blockNumber).toEqual(150)
        return 1234
      },
    })

    let added = 0
    const userTransactionRepository = mock<UserTransactionRepository>({
      async add() {
        added += 1
        return 1
      },
    })

    const collector = new UserTransactionCollector(
      ethereumClient,
      userTransactionRepository,
      EthereumAddress.fake()
    )

    await collector.collect(new BlockRange([], 100, 200))
    expect(added).toEqual(3)
  })
})
