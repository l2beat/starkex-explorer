import {
  AssetHash,
  EthereumAddress,
  Hash256,
  StarkKey,
  Timestamp,
} from '@explorer/types'
import { expect, mockObject } from 'earljs'
import { BigNumber, providers } from 'ethers'

import { BlockRange } from '../../model'
import {
  WithdrawableAssetAddRecord,
  WithdrawableAssetRepository,
} from '../../peripherals/database/WithdrawableAssetRepository'
import { EthereumClient } from '../../peripherals/ethereum/EthereumClient'
import {
  LogAssetWithdrawalAllowed,
  LogMintableWithdrawalAllowed,
  LogWithdrawalAllowed,
} from './events'
import { WithdrawalAllowedCollector } from './WithdrawalAllowedCollector'

describe(WithdrawalAllowedCollector.name, () => {
  it(`can process ${LogWithdrawalAllowed.name}`, async () => {
    const blockRange = new BlockRange([], 100, 200)
    const starkKey = StarkKey.fake('123')
    const assetType = AssetHash.fake('a1b2')
    const nonQuantizedAmount = 111n
    const quantizedAmount = 222n
    const transactionHash = Hash256.fake('abc')
    const perpetualAddress = EthereumAddress.fake('def')

    const ethereumClient = mockObject<EthereumClient>({
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
    const withdrawableAssetRepository = mockObject<WithdrawableAssetRepository>(
      {
        async add(record) {
          added = record
          return 1
        },
      }
    )

    const collector = new WithdrawalAllowedCollector(
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
        type: 'WithdrawalAllowed',
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

    const ethereumClient = mockObject<EthereumClient>({
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
    const withdrawableAssetRepository = mockObject<WithdrawableAssetRepository>(
      {
        async add(record) {
          added = record
          return 1
        },
      }
    )

    const collector = new WithdrawalAllowedCollector(
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
        type: 'MintableWithdrawalAllowed',
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

    const ethereumClient = mockObject<EthereumClient>({
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
    const withdrawableAssetRepository = mockObject<WithdrawableAssetRepository>(
      {
        async add(record) {
          added = record
          return 1
        },
      }
    )

    const collector = new WithdrawalAllowedCollector(
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
        type: 'AssetWithdrawalAllowed',
        starkKey,
        assetId,
        quantizedAmount,
      },
    })
  })
})
