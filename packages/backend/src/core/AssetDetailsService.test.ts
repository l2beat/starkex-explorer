import {
  AssetId,
  EthereumAddress,
  Hash256,
  StarkKey,
  Timestamp,
} from '@explorer/types'
import { expect, mockFn } from 'earljs'

import { AssetRepository } from '../peripherals/database/AssetRepository'
import { PreprocessedAssetHistoryRecord } from '../peripherals/database/PreprocessedAssetHistoryRepository'
import { SentTransactionData } from '../peripherals/database/transactions/SentTransaction'
import { UserTransactionData } from '../peripherals/database/transactions/UserTransaction'
import { UserTransactionRecord } from '../peripherals/database/transactions/UserTransactionRepository'
import {
  fakeErc20Details,
  fakeErc721Details,
  fakeErc1155Details,
} from '../test/fakes'
import { mock } from '../test/mock'
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
      const assetRepository = mock<AssetRepository>()
      const assetDetailsService = new AssetDetailsService(
        assetRepository,
        'perpetual'
      )

      const result = await assetDetailsService.getAssetDetailsMap({})

      expect(result).toEqual(undefined)
    })

    it('should return asset detail map when trading mode is spot', async () => {
      const assetRepository = mock<AssetRepository>()
      const mockGetDetailsByAssetHashesOrTypeHashes =
        mockFn<AssetRepository['getDetailsByAssetHashesOrTypeHashes']>()
      assetRepository.getDetailsByAssetHashesOrTypeHashes =
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
      expect(mockGetDetailsByAssetHashesOrTypeHashes).toBeExhausted()
    })
  })

  describe(
    AssetDetailsService.prototype.getSentTransactionAssetIdentifiers.name,
    () => {
      const assetDetailsService = new AssetDetailsService(
        mock<AssetRepository>(),
        'spot'
      )
      it('should return assetType from data when type is Withdraw', () => {
        const result = assetDetailsService.getSentTransactionAssetIdentifiers(
          sentTransaction({
            type: 'Withdraw',
            assetType: fakeErc20Details.assetHash,
            starkKey: StarkKey.fake(),
          })
        )

        expect(result).toEqual(fakeErc20Details.assetHash)
      })

      it('should return assetTypeHash from data for WithdrawWithTokenId', () => {
        const result = assetDetailsService.getSentTransactionAssetIdentifiers(
          sentTransaction({
            type: 'WithdrawWithTokenId',
            assetType: fakeErc721Details.assetTypeHash,
            tokenId: 1n,
            starkKey: StarkKey.fake(),
          })
        )

        expect(result).toEqual(fakeErc721Details.assetTypeHash)
      })

      it('should return undefined for ForcedWithdrawal', () => {
        const result = assetDetailsService.getSentTransactionAssetIdentifiers(
          sentTransaction({
            type: 'ForcedWithdrawal',
            starkKey: StarkKey.fake(),
            positionId: 2n,
            quantizedAmount: 3n,
            premiumCost: false,
          })
        )

        expect(result).toEqual(undefined)
      })

      it('should return undefined for ForcedTrade', () => {
        const result = assetDetailsService.getSentTransactionAssetIdentifiers(
          sentTransaction({
            type: 'ForcedTrade',
            starkKeyA: StarkKey.fake(),
            starkKeyB: StarkKey.fake(),
            positionIdA: 1n,
            positionIdB: 2n,
            collateralAmount: 3n,
            collateralAssetId: AssetId('USDC-6'),
            syntheticAmount: 4n,
            syntheticAssetId: AssetId('ETH-9'),
            isABuyingSynthetic: true,
            submissionExpirationTime: Timestamp.fromHours(12345),
            nonce: 1n,
            signatureB: '0x',
            premiumCost: false,
            offerId: 1,
          })
        )

        expect(result).toEqual(undefined)
      })
    }
  )

  describe(
    AssetDetailsService.prototype.getUserTransactionAssetIdentifiers.name,
    () => {
      const assetDetailsService = new AssetDetailsService(
        mock<AssetRepository>(),
        'spot'
      )
      it('should return assetType from data for Withdraw', () => {
        const result = assetDetailsService.getUserTransactionAssetIdentifiers(
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
        const result = assetDetailsService.getUserTransactionAssetIdentifiers(
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
        const result = assetDetailsService.getUserTransactionAssetIdentifiers(
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
        const result = assetDetailsService.getUserTransactionAssetIdentifiers(
          userTransaction({ type: 'ForcedWithdrawal' } as UserTransactionData)
        )
        expect(result).toEqual(undefined)
      })
      it('should return undefined for ForcedTrade', () => {
        const result = assetDetailsService.getUserTransactionAssetIdentifiers(
          userTransaction({ type: 'ForcedTrade' } as UserTransactionData)
        )
        expect(result).toEqual(undefined)
      })
      it('should return undefined for FullWithdrawal', () => {
        const result = assetDetailsService.getUserTransactionAssetIdentifiers(
          userTransaction({ type: 'FullWithdrawal' } as UserTransactionData)
        )
        expect(result).toEqual(undefined)
      })
    }
  )
})
