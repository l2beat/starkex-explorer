import { EthereumAddress, Hash256, StarkKey, Timestamp } from '@explorer/types'
import { expect, mockFn, mockObject } from 'earljs'

import { AssetRepository } from '../peripherals/database/AssetRepository'
import { PreprocessedAssetHistoryRecord } from '../peripherals/database/PreprocessedAssetHistoryRepository'
import { SentTransactionData } from '../peripherals/database/transactions/SentTransaction'
import { UserTransactionData } from '../peripherals/database/transactions/UserTransaction'
import { UserTransactionRecord } from '../peripherals/database/transactions/UserTransactionRepository'
import {
  fakeErc1155Details,
  fakeErc20Details,
  fakeErc721Details,
} from '../test/fakes'
import { AssetDetailsMap } from './AssetDetailsMap'
import { AssetDetailsService } from './AssetDetailsService'

describe(AssetDetailsService.name, () => {
  const sentTransaction = (data: SentTransactionData) => ({
    transactionHash: Hash256.fake(),
    starkKey: StarkKey.fake(),
    vaultOrPositionId: 1n,
    sentTimestamp: Timestamp(1),
    data,
  })
  const userTransaction = (
    data: UserTransactionData
  ): UserTransactionRecord => ({
    id: 2,
    starkKeyA: StarkKey.fake(),
    transactionHash: Hash256.fake(),
    blockNumber: 1,
    vaultOrPositionIdA: 1n,
    timestamp: Timestamp(1),
    data,
  })

  describe(AssetDetailsService.prototype.getAssetDetailsMap.name, () => {
    it('should return undefined when trading mode is spot', async () => {
      const assetRepository = mockObject<AssetRepository>()
      const assetDetailsService = new AssetDetailsService(
        assetRepository,
        'perpetual'
      )

      const result = await assetDetailsService.getAssetDetailsMap({})

      expect(result).toEqual(undefined)
    })

    it('should return asset detail map when trading mode is spot', async () => {
      const assetRepository = mockObject<AssetRepository>()
      const mockGetDetailsByAssetHashesOrTypeHashes =
        mockFn<AssetRepository['getDetailsByAssetHashes']>()
      assetRepository.getDetailsByAssetHashes =
        mockGetDetailsByAssetHashesOrTypeHashes
      mockGetDetailsByAssetHashesOrTypeHashes
        .given([
          fakeErc20Details.assetHash,
          fakeErc721Details.assetHash,
          fakeErc1155Details.assetHash,
        ])
        .resolvesToOnce([
          fakeErc20Details,
          fakeErc721Details,
          fakeErc1155Details,
        ])
      const assetDetailsService = new AssetDetailsService(
        assetRepository,
        'spot'
      )

      const result = await assetDetailsService.getAssetDetailsMap({
        sentTransactions: [
          sentTransaction({
            type: 'Withdraw',
            assetType: fakeErc20Details.assetHash,
            starkKey: StarkKey.fake(),
          }),
        ],
        userTransactions: [
          userTransaction({
            type: 'MintWithdraw',
            starkKey: StarkKey.fake(),
            assetType: Hash256.fake(),
            assetId: fakeErc721Details.assetHash,
            nonQuantizedAmount: 2n,
            quantizedAmount: 3n,
          }),
        ],
        userAssets: [
          {
            assetHashOrId: fakeErc721Details.assetHash,
          } as PreprocessedAssetHistoryRecord,
        ],
        assetHistory: [
          {
            assetHashOrId: fakeErc1155Details.assetHash,
          } as PreprocessedAssetHistoryRecord,
        ],
      })

      expect(result).toEqual(
        new AssetDetailsMap([
          fakeErc20Details,
          fakeErc721Details,
          fakeErc1155Details,
        ])
      )
    })
  })

  describe(
    AssetDetailsService.prototype.getUserTransactionAssetHash.name,
    () => {
      const assetDetailsService = new AssetDetailsService(
        mockObject<AssetRepository>(),
        'spot'
      )
      it('should return assetType from data for Withdraw', () => {
        const result = assetDetailsService.getUserTransactionAssetHash(
          userTransaction({
            type: 'Withdraw',
            starkKey: StarkKey.fake(),
            assetType: fakeErc20Details.assetHash,
            nonQuantizedAmount: 2n,
            quantizedAmount: 3n,
            recipient: EthereumAddress.fake(),
          })
        )

        expect(result).toEqual(fakeErc20Details.assetHash)
      })

      it('should return assetId from data for WithdrawWithTokenId', () => {
        const result = assetDetailsService.getUserTransactionAssetHash(
          userTransaction({
            type: 'WithdrawWithTokenId',
            starkKey: StarkKey.fake(),
            assetType: Hash256.fake(),
            tokenId: 2n,
            assetId: fakeErc721Details.assetHash,
            nonQuantizedAmount: 2n,
            quantizedAmount: 3n,
            recipient: EthereumAddress.fake(),
          })
        )

        expect(result).toEqual(fakeErc721Details.assetHash)
      })

      it('should return assetId from data for MintWithdraw', () => {
        const result = assetDetailsService.getUserTransactionAssetHash(
          userTransaction({
            type: 'MintWithdraw',
            starkKey: StarkKey.fake(),
            assetType: Hash256.fake(),
            assetId: fakeErc721Details.assetHash,
            nonQuantizedAmount: 2n,
            quantizedAmount: 3n,
          })
        )
        expect(result).toEqual(fakeErc721Details.assetHash)
      })

      it('should return undefined for ForcedWithdrawal', () => {
        const result = assetDetailsService.getUserTransactionAssetHash(
          userTransaction({ type: 'ForcedWithdrawal' } as UserTransactionData)
        )
        expect(result).toEqual(undefined)
      })
      it('should return undefined for ForcedTrade', () => {
        const result = assetDetailsService.getUserTransactionAssetHash(
          userTransaction({ type: 'ForcedTrade' } as UserTransactionData)
        )
        expect(result).toEqual(undefined)
      })
      it('should return undefined for FullWithdrawal', () => {
        const result = assetDetailsService.getUserTransactionAssetHash(
          userTransaction({ type: 'FullWithdrawal' } as UserTransactionData)
        )
        expect(result).toEqual(undefined)
      })
    }
  )
})
