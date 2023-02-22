import {
  AssetHash,
  EthereumAddress,
  Hash256,
  StarkKey,
  Timestamp,
} from '@explorer/types'
import { expect } from 'earljs'

import { setupDatabaseTestSuite } from '../../test/database'
import { Logger } from '../../tools/Logger'
import { WithdrawableAssetRepository } from './WithdrawableAssetRepository'
import {
  AssetWithdrawalAllowedData,
  MintableWithdrawalAllowedData,
  MintWithdrawalPerformedData,
  WithdrawalAllowedData,
  WithdrawalPerformedData,
  WithdrawalWithTokenIdPerformedData,
} from './WithdrawableBalanceChange'

describe(WithdrawableAssetRepository.name, () => {
  const { database } = setupDatabaseTestSuite()
  const repository = new WithdrawableAssetRepository(database, Logger.SILENT)

  afterEach(() => repository.deleteAll())

  function fakeWithdrawalAllowedData(
    override?: Partial<WithdrawalAllowedData>
  ): WithdrawalAllowedData {
    return {
      event: 'LogWithdrawalAllowed',
      starkKey: StarkKey.fake(),
      assetType: AssetHash.fake(),
      nonQuantizedAmount: 123000n,
      quantizedAmount: 123n,
      ...override,
    }
  }

  function fakeMintableWithdrawalAllowedData(
    override?: Partial<MintableWithdrawalAllowedData>
  ): MintableWithdrawalAllowedData {
    return {
      event: 'LogMintableWithdrawalAllowed',
      starkKey: StarkKey.fake(),
      assetId: AssetHash.fake(),
      quantizedAmount: 234n,
      ...override,
    }
  }

  function fakeAssetWithdrawalAllowedData(
    override?: Partial<AssetWithdrawalAllowedData>
  ): AssetWithdrawalAllowedData {
    return {
      event: 'LogAssetWithdrawalAllowed',
      starkKey: StarkKey.fake(),
      assetId: AssetHash.fake(),
      quantizedAmount: 345n,
      ...override,
    }
  }

  function fakeWithdrawalPerformedData(
    override?: Partial<WithdrawalPerformedData>
  ): WithdrawalPerformedData {
    return {
      event: 'LogWithdrawalPerformed',
      starkKey: StarkKey.fake(),
      assetType: AssetHash.fake(),
      nonQuantizedAmount: 45600n,
      quantizedAmount: 456n,
      recipient: EthereumAddress.fake(),
      ...override,
    }
  }

  function fakeWithdrawalWithTokenIdPerformedData(
    override?: Partial<WithdrawalWithTokenIdPerformedData>
  ): WithdrawalWithTokenIdPerformedData {
    return {
      event: 'LogWithdrawalWithTokenIdPerformed',
      starkKey: StarkKey.fake(),
      assetType: AssetHash.fake(),
      tokenId: 1n,
      assetId: AssetHash.fake(),
      nonQuantizedAmount: 567000n,
      quantizedAmount: 567n,
      recipient: EthereumAddress.fake(),
      ...override,
    }
  }

  function fakeMintWithdrawalPerformedData(
    override?: Partial<MintWithdrawalPerformedData>
  ): MintWithdrawalPerformedData {
    return {
      event: 'LogMintWithdrawalPerformed',
      starkKey: StarkKey.fake(),
      assetType: AssetHash.fake(),
      nonQuantizedAmount: 678000n,
      quantizedAmount: 678n,
      assetId: AssetHash.fake(),
      ...override,
    }
  }

  describe(WithdrawableAssetRepository.prototype.add.name, () => {
    it('adds records', async () => {
      const fake1 = {
        transactionHash: Hash256.fake(),
        blockNumber: 123,
        timestamp: Timestamp(123000),
        data: fakeWithdrawalAllowedData(),
      }
      const id1 = await repository.add(fake1)

      const fake2 = {
        transactionHash: Hash256.fake(),
        blockNumber: 123,
        timestamp: Timestamp(123000),
        data: fakeMintableWithdrawalAllowedData(),
      }
      const id2 = await repository.add(fake2)

      const fake3 = {
        transactionHash: Hash256.fake(),
        blockNumber: 123,
        timestamp: Timestamp(123000),
        data: fakeAssetWithdrawalAllowedData(),
      }
      const id3 = await repository.add(fake3)

      const fake4 = {
        transactionHash: Hash256.fake(),
        blockNumber: 123,
        timestamp: Timestamp(123000),
        data: fakeWithdrawalPerformedData(),
      }
      const id4 = await repository.add(fake4)

      const fake5 = {
        transactionHash: Hash256.fake(),
        blockNumber: 123,
        timestamp: Timestamp(123000),
        data: fakeWithdrawalWithTokenIdPerformedData(),
      }
      const id5 = await repository.add(fake5)

      const fake6 = {
        transactionHash: Hash256.fake(),
        blockNumber: 123,
        timestamp: Timestamp(123000),
        data: fakeMintWithdrawalPerformedData(),
      }
      const id6 = await repository.add(fake6)

      const record1 = await repository.findById(id1)
      const record2 = await repository.findById(id2)
      const record3 = await repository.findById(id3)
      const record4 = await repository.findById(id4)
      const record5 = await repository.findById(id5)
      const record6 = await repository.findById(id6)

      expect(record1?.transactionHash).toEqual(fake1.transactionHash)
      expect(record1?.blockNumber).toEqual(fake1.blockNumber)
      expect(record1?.timestamp).toEqual(fake1.timestamp)
      expect(record1?.data).toEqual(fake1.data)
      expect(record2?.data).toEqual(fake2.data)
      expect(record3?.data).toEqual(fake3.data)
      expect(record4?.data).toEqual(fake4.data)
      expect(record5?.data).toEqual(fake5.data)
      expect(record6?.data).toEqual(fake6.data)
    })

    it('removes all transactions after the given block', async () => {
      const id1 = await repository.add({
        transactionHash: Hash256.fake(),
        blockNumber: 123,
        timestamp: Timestamp(123000),
        data: fakeWithdrawalAllowedData(),
      })

      const id2 = await repository.add({
        transactionHash: Hash256.fake(),
        blockNumber: 456,
        timestamp: Timestamp(123000),
        data: fakeWithdrawalAllowedData(),
      })

      expect(await repository.findById(id1)).not.toEqual(undefined)
      expect(await repository.findById(id2)).not.toEqual(undefined)

      await repository.deleteAfter(400)

      expect(await repository.findById(id1)).not.toEqual(undefined)
      expect(await repository.findById(id2)).toEqual(undefined)
    })

    it('removes all transactions', async () => {
      const id1 = await repository.add({
        transactionHash: Hash256.fake(),
        blockNumber: 123,
        timestamp: Timestamp(123000),
        data: fakeWithdrawalAllowedData(),
      })

      const id2 = await repository.add({
        transactionHash: Hash256.fake(),
        blockNumber: 456,
        timestamp: Timestamp(123000),
        data: fakeWithdrawalAllowedData(),
      })

      expect(await repository.findById(id1)).not.toEqual(undefined)
      expect(await repository.findById(id2)).not.toEqual(undefined)

      await repository.deleteAll()

      expect(await repository.findById(id1)).toEqual(undefined)
      expect(await repository.findById(id2)).toEqual(undefined)
    })
  })
})
