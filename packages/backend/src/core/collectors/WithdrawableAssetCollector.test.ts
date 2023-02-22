import {
  AssetHash,
  EthereumAddress,
  Hash256,
  StarkKey,
  Timestamp,
} from '@explorer/types'
import { expect } from 'earljs'
import { BigNumber, providers } from 'ethers'

import { BlockRange } from '../../model'
import { WithdrawableAssetAddRecord } from '../../peripherals/database/transactions/UserTransactionRepository'
import { WithdrawableAssetRepository } from '../../peripherals/database/WithdrawableAssetRepository'
import { EthereumClient } from '../../peripherals/ethereum/EthereumClient'
import { mock } from '../../test/mock'
import {
  LogAssetWithdrawalAllowed,
  LogMintableWithdrawalAllowed,
  LogMintWithdrawalPerformed,
  LogWithdrawalAllowed,
  LogWithdrawalPerformed,
  LogWithdrawalWithTokenIdPerformed,
} from './events'
import { WithdrawableAssetCollector } from './WithdrawableAssetCollector'

describe(WithdrawableAssetCollector.name, () => {
  it(`can process ${LogWithdrawalAllowed.name}`, async () => {
    const blockRange = new BlockRange([], 100, 200)
    const starkKey = StarkKey.fake('123')
    const assetType = AssetHash.fake('a1b2')
    const nonQuantizedAmount = 111n
    const quantizedAmount = 222n
    const transactionHash = Hash256.fake('abc')
    const perpetualAddress = EthereumAddress.fake('def')

    const ethereumClient = mock<EthereumClient>({
      async getLogsInRange(range, parameters) {
        expect(range).toEqual(blockRange)
        expect(parameters.address).toEqual(perpetualAddress.toString())

        const log = LogWithdrawalAllowed.encodeLog([
          BigNumber.from(starkKey),
          BigNumber.from(assetType),
          BigNumber.from(nonQuantizedAmount),
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

    let added: WithdrawableAssetAddRecord | undefined
    const withdrawableAssetRepository = mock<WithdrawableAssetRepository>({
      async add(record) {
        added = record
        return 1
      },
    })

    const collector = new WithdrawableAssetCollector(
      ethereumClient,
      withdrawableAssetRepository,
      perpetualAddress
    )

    await collector.collect(blockRange)

    expect(added).toEqual({
      blockNumber: 150,
      transactionHash,
      timestamp: Timestamp(1234000),
      data: {
        event: 'LogWithdrawalAllowed',
        starkKey,
        assetType,
        nonQuantizedAmount,
        quantizedAmount,
      },
    })
  })

  it(`can process ${LogMintableWithdrawalAllowed.name}`, async () => {
    const blockRange = new BlockRange([], 100, 200)
    const starkKey = StarkKey.fake('123')
    const assetId = AssetHash.fake('a1b2')
    const quantizedAmount = 222n
    const transactionHash = Hash256.fake('abc')
    const perpetualAddress = EthereumAddress.fake('def')

    const ethereumClient = mock<EthereumClient>({
      async getLogsInRange(range, parameters) {
        expect(range).toEqual(blockRange)
        expect(parameters.address).toEqual(perpetualAddress.toString())

        const log = LogMintableWithdrawalAllowed.encodeLog([
          BigNumber.from(starkKey),
          BigNumber.from(assetId),
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

    let added: WithdrawableAssetAddRecord | undefined
    const withdrawableAssetRepository = mock<WithdrawableAssetRepository>({
      async add(record) {
        added = record
        return 1
      },
    })

    const collector = new WithdrawableAssetCollector(
      ethereumClient,
      withdrawableAssetRepository,
      perpetualAddress
    )

    await collector.collect(blockRange)

    expect(added).toEqual({
      blockNumber: 150,
      transactionHash,
      timestamp: Timestamp(1234000),
      data: {
        event: 'LogMintableWithdrawalAllowed',
        starkKey,
        assetId,
        quantizedAmount,
      },
    })
  })

  it(`can process ${LogAssetWithdrawalAllowed.name}`, async () => {
    const blockRange = new BlockRange([], 100, 200)
    const starkKey = StarkKey.fake('123')
    const assetId = AssetHash.fake('a1b2')
    const quantizedAmount = 222n
    const transactionHash = Hash256.fake('abc')
    const perpetualAddress = EthereumAddress.fake('def')

    const ethereumClient = mock<EthereumClient>({
      async getLogsInRange(range, parameters) {
        expect(range).toEqual(blockRange)
        expect(parameters.address).toEqual(perpetualAddress.toString())

        const log = LogAssetWithdrawalAllowed.encodeLog([
          BigNumber.from(starkKey),
          BigNumber.from(assetId),
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

    let added: WithdrawableAssetAddRecord | undefined
    const withdrawableAssetRepository = mock<WithdrawableAssetRepository>({
      async add(record) {
        added = record
        return 1
      },
    })

    const collector = new WithdrawableAssetCollector(
      ethereumClient,
      withdrawableAssetRepository,
      perpetualAddress
    )

    await collector.collect(blockRange)

    expect(added).toEqual({
      blockNumber: 150,
      transactionHash,
      timestamp: Timestamp(1234000),
      data: {
        event: 'LogAssetWithdrawalAllowed',
        starkKey,
        assetId,
        quantizedAmount,
      },
    })
  })

  it(`can process ${LogWithdrawalPerformed.name}`, async () => {
    const blockRange = new BlockRange([], 100, 200)
    const starkKey = StarkKey.fake('123')
    const assetType = AssetHash.fake('a1b2')
    const nonQuantizedAmount = 111n
    const quantizedAmount = 222n
    const recipient = EthereumAddress.fake('cba')
    const transactionHash = Hash256.fake('abc')
    const perpetualAddress = EthereumAddress.fake('def')

    const ethereumClient = mock<EthereumClient>({
      async getLogsInRange(range, parameters) {
        expect(range).toEqual(blockRange)
        expect(parameters.address).toEqual(perpetualAddress.toString())

        const log = LogWithdrawalPerformed.encodeLog([
          BigNumber.from(starkKey),
          BigNumber.from(assetType),
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

    let added: WithdrawableAssetAddRecord | undefined
    const withdrawableAssetRepository = mock<WithdrawableAssetRepository>({
      async add(record) {
        added = record
        return 1
      },
    })

    const collector = new WithdrawableAssetCollector(
      ethereumClient,
      withdrawableAssetRepository,
      perpetualAddress
    )

    await collector.collect(blockRange)

    expect(added).toEqual({
      blockNumber: 150,
      transactionHash,
      timestamp: Timestamp(1234000),
      data: {
        event: 'LogWithdrawalPerformed',
        starkKey,
        assetType,
        nonQuantizedAmount,
        quantizedAmount,
        recipient,
      },
    })
  })

  it(`can process ${LogWithdrawalWithTokenIdPerformed.name}`, async () => {
    const blockRange = new BlockRange([], 100, 200)
    const starkKey = StarkKey.fake('123')
    const assetType = AssetHash.fake('a1b2')
    const assetId = AssetHash.fake('c1d2')
    const tokenId = 22n
    const nonQuantizedAmount = 111n
    const quantizedAmount = 222n
    const recipient = EthereumAddress.fake('cba')
    const transactionHash = Hash256.fake('abc')
    const perpetualAddress = EthereumAddress.fake('def')

    const ethereumClient = mock<EthereumClient>({
      async getLogsInRange(range, parameters) {
        expect(range).toEqual(blockRange)
        expect(parameters.address).toEqual(perpetualAddress.toString())

        const log = LogWithdrawalWithTokenIdPerformed.encodeLog([
          BigNumber.from(starkKey),
          BigNumber.from(assetType),
          BigNumber.from(tokenId),
          BigNumber.from(assetId),
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

    let added: WithdrawableAssetAddRecord | undefined
    const withdrawableAssetRepository = mock<WithdrawableAssetRepository>({
      async add(record) {
        added = record
        return 1
      },
    })

    const collector = new WithdrawableAssetCollector(
      ethereumClient,
      withdrawableAssetRepository,
      perpetualAddress
    )

    await collector.collect(blockRange)

    expect(added).toEqual({
      blockNumber: 150,
      transactionHash,
      timestamp: Timestamp(1234000),
      data: {
        event: 'LogWithdrawalWithTokenIdPerformed',
        starkKey,
        assetType,
        tokenId,
        assetId,
        nonQuantizedAmount,
        quantizedAmount,
        recipient,
      },
    })
  })

  it(`can process ${LogMintWithdrawalPerformed.name}`, async () => {
    const blockRange = new BlockRange([], 100, 200)
    const starkKey = StarkKey.fake('123')
    const assetType = AssetHash.fake('a1b2')
    const assetId = AssetHash.fake('c1d2')
    const nonQuantizedAmount = 111n
    const quantizedAmount = 222n
    const transactionHash = Hash256.fake('abc')
    const perpetualAddress = EthereumAddress.fake('def')

    const ethereumClient = mock<EthereumClient>({
      async getLogsInRange(range, parameters) {
        expect(range).toEqual(blockRange)
        expect(parameters.address).toEqual(perpetualAddress.toString())

        const log = LogMintWithdrawalPerformed.encodeLog([
          BigNumber.from(starkKey),
          BigNumber.from(assetType),
          BigNumber.from(nonQuantizedAmount),
          BigNumber.from(quantizedAmount),
          BigNumber.from(assetId),
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

    let added: WithdrawableAssetAddRecord | undefined
    const withdrawableAssetRepository = mock<WithdrawableAssetRepository>({
      async add(record) {
        added = record
        return 1
      },
    })

    const collector = new WithdrawableAssetCollector(
      ethereumClient,
      withdrawableAssetRepository,
      perpetualAddress
    )

    await collector.collect(blockRange)

    expect(added).toEqual({
      blockNumber: 150,
      transactionHash,
      timestamp: Timestamp(1234000),
      data: {
        event: 'LogMintWithdrawalPerformed',
        starkKey,
        assetType,
        nonQuantizedAmount,
        quantizedAmount,
        assetId,
      },
    })
  })
})
