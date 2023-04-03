import { encodeAssetId } from '@explorer/encoding'
import {
  AssetHash,
  AssetId,
  EthereumAddress,
  Hash256,
  StarkKey,
  Timestamp,
} from '@explorer/types'
import { expect, mockObject } from 'earl'
import { BigNumber, providers } from 'ethers'

import { BlockRange } from '../../model'
import {
  MintWithdrawData,
  WithdrawData,
  WithdrawWithTokenIdData,
} from '../../peripherals/database/transactions/UserTransaction'
import {
  UserTransactionAddRecord,
  UserTransactionRepository,
} from '../../peripherals/database/transactions/UserTransactionRepository'
import {
  WithdrawableAssetAddRecord,
  WithdrawableAssetRepository,
} from '../../peripherals/database/WithdrawableAssetRepository'
import { EthereumClient } from '../../peripherals/ethereum/EthereumClient'
import { fakeCollateralAsset } from '../../test/fakes'
import {
  LogForcedTradeRequest,
  LogForcedWithdrawalRequest,
  LogFullWithdrawalRequest,
  LogMintWithdrawalPerformed,
  LogWithdrawalPerformed,
  LogWithdrawalWithTokenIdPerformed,
} from './events'
import { UserTransactionCollector } from './UserTransactionCollector'

describe(UserTransactionCollector.name, () => {
  it(`can process ${LogWithdrawalPerformed.name}`, async () => {
    const blockRange = new BlockRange([], 100, 200)
    const starkKey = StarkKey.fake('123')
    const assetType = AssetHash.fake('a1b2')
    const nonQuantizedAmount = 111n
    const quantizedAmount = 222n
    const recipient = EthereumAddress.fake('456')
    const transactionHash = Hash256.fake('abc')
    const perpetualAddress = EthereumAddress.fake('def')

    const ethereumClient = mockObject<EthereumClient>({
      async getLogsInRange(range, parameters) {
        expect(range).toEqual(blockRange)
        expect(parameters.address).toEqual(perpetualAddress.toString())

        const log = LogWithdrawalPerformed.encodeLog([
          starkKey.toString(),
          assetType.toString(),
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
    const userTransactionRepository = mockObject<UserTransactionRepository>({
      async add(record) {
        added = record
        return 1
      },
    })
    let addedWithdrawable: WithdrawableAssetAddRecord | undefined
    const withdrawableAssetRepository = mockObject<WithdrawableAssetRepository>(
      {
        async add(record) {
          addedWithdrawable = record
          return 1
        },
      }
    )

    const collector = new UserTransactionCollector(
      ethereumClient,
      userTransactionRepository,
      withdrawableAssetRepository,
      perpetualAddress
    )

    await collector.collect(blockRange)

    const expected = {
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
      } as WithdrawData,
    }
    expect(added).toEqual(expected)
    expect(addedWithdrawable).toEqual(expected)
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

    const ethereumClient = mockObject<EthereumClient>({
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

    let added: UserTransactionAddRecord | undefined
    const userTransactionRepository = mockObject<UserTransactionRepository>({
      async add(record) {
        added = record
        return 1
      },
    })
    let addedWithdrawable: WithdrawableAssetAddRecord | undefined
    const withdrawableAssetRepository = mockObject<WithdrawableAssetRepository>(
      {
        async add(record) {
          addedWithdrawable = record
          return 1
        },
      }
    )

    const collector = new UserTransactionCollector(
      ethereumClient,
      userTransactionRepository,
      withdrawableAssetRepository,
      perpetualAddress
    )

    await collector.collect(blockRange)

    const expected = {
      blockNumber: 150,
      transactionHash,
      timestamp: Timestamp(1234000),
      data: {
        type: 'WithdrawWithTokenId',
        starkKey,
        assetType,
        tokenId,
        assetId,
        nonQuantizedAmount,
        quantizedAmount,
        recipient,
      } as WithdrawWithTokenIdData,
    }
    expect(added).toEqual(expected)
    expect(addedWithdrawable).toEqual(expected)
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

    const ethereumClient = mockObject<EthereumClient>({
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

    let added: UserTransactionAddRecord | undefined
    const userTransactionRepository = mockObject<UserTransactionRepository>({
      async add(record) {
        added = record
        return 1
      },
    })
    let addedWithdrawable: WithdrawableAssetAddRecord | undefined
    const withdrawableAssetRepository = mockObject<WithdrawableAssetRepository>(
      {
        async add(record) {
          addedWithdrawable = record
          return 1
        },
      }
    )

    const collector = new UserTransactionCollector(
      ethereumClient,
      userTransactionRepository,
      withdrawableAssetRepository,
      perpetualAddress
    )

    await collector.collect(blockRange)

    const expected = {
      blockNumber: 150,
      transactionHash,
      timestamp: Timestamp(1234000),
      data: {
        type: 'MintWithdraw',
        starkKey,
        assetType,
        nonQuantizedAmount,
        quantizedAmount,
        assetId,
      } as MintWithdrawData,
    }
    expect(added).toEqual(expected)
    expect(addedWithdrawable).toEqual(expected)
  })

  it(`can process ${LogForcedWithdrawalRequest.name}`, async () => {
    const blockRange = new BlockRange([], 100, 200)
    const starkKey = StarkKey.fake('123')
    const positionId = 123n
    const quantizedAmount = 456n
    const transactionHash = Hash256.fake('abc')
    const perpetualAddress = EthereumAddress.fake('def')

    const ethereumClient = mockObject<EthereumClient>({
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
    const userTransactionRepository = mockObject<UserTransactionRepository>({
      async add(record) {
        added = record
        return 1
      },
    })

    const collector = new UserTransactionCollector(
      ethereumClient,
      userTransactionRepository,
      mockObject<WithdrawableAssetRepository>(),
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

    const ethereumClient = mockObject<EthereumClient>({
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
    const userTransactionRepository = mockObject<UserTransactionRepository>({
      async add(record) {
        added = record
        return 1
      },
    })

    const collector = new UserTransactionCollector(
      ethereumClient,
      userTransactionRepository,
      mockObject<WithdrawableAssetRepository>(),
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
    const collateralAssetId =
      '0x02893294412a4c8f915f75892b395ebbf6859ec246ec365c3b1f56f47c3a0a5d'
    const syntheticAmount = 2000n
    const syntheticAssetId = AssetId('ETH-9')
    const isABuyingSynthetic = true
    const nonce = 42069n

    const transactionHash = Hash256.fake('abc')
    const perpetualAddress = EthereumAddress.fake('def')

    const ethereumClient = mockObject<EthereumClient>({
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
    const userTransactionRepository = mockObject<UserTransactionRepository>({
      async add(record) {
        added = record
        return 1
      },
    })

    const collector = new UserTransactionCollector(
      ethereumClient,
      userTransactionRepository,
      mockObject<WithdrawableAssetRepository>(),
      perpetualAddress,
      fakeCollateralAsset
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
    const ethereumClient = mockObject<EthereumClient>({
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
    const userTransactionRepository = mockObject<UserTransactionRepository>({
      async add() {
        added += 1
        return 1
      },
    })

    const collector = new UserTransactionCollector(
      ethereumClient,
      userTransactionRepository,
      mockObject<WithdrawableAssetRepository>(),
      EthereumAddress.fake()
    )

    await collector.collect(new BlockRange([], 100, 200))
    expect(added).toEqual(3)
  })
})
