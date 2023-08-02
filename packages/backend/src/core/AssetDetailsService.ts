import { assertUnreachable, TradingMode } from '@explorer/shared'
import { AssetHash } from '@explorer/types'
import uniqBy from 'lodash/uniqBy'

import { AssetRepository } from '../peripherals/database/AssetRepository'
import { PreprocessedAssetHistoryRecord } from '../peripherals/database/PreprocessedAssetHistoryRepository'
import { SentTransactionRecord } from '../peripherals/database/transactions/SentTransactionRepository'
import { UserTransactionRecord } from '../peripherals/database/transactions/UserTransactionRepository'
import { AssetDetailsMap } from './AssetDetailsMap'

export class AssetDetailsService {
  constructor(
    private readonly assetRepository: AssetRepository,
    private readonly tradingMode: TradingMode
  ) {}

  async getAssetDetailsMap(records: {
    userAssets?: PreprocessedAssetHistoryRecord[]
    assetHistory?: PreprocessedAssetHistoryRecord[]
    sentTransactions?: SentTransactionRecord[]
    userTransactions?: UserTransactionRecord[]
    withdrawableAssets?: { assetHash: AssetHash; withdrawableBalance: bigint }[]
  }): Promise<AssetDetailsMap | undefined> {
    if (this.tradingMode !== 'spot') {
      return undefined
    }

    const assetHashes: AssetHash[] = [
      ...(records.sentTransactions?.map((tx) =>
        tx.data.type === 'Withdraw' ? tx.data.assetType : undefined
      ) ?? []),
      ...(records.userAssets?.map((a) => a.assetHashOrId) ?? []),
      ...(records.assetHistory?.map((a) => a.assetHashOrId) ?? []),
      ...(records.userTransactions?.map((tx) =>
        this.getUserTransactionAssetHash(tx)
      ) ?? []),
      ...(records.withdrawableAssets?.map((a) => a.assetHash) ?? []),
    ].filter((hash): hash is AssetHash => AssetHash.check(hash))

    const assetTypeAndTokenIds: { assetType: AssetHash; tokenId: bigint }[] =
      records.sentTransactions
        ?.map((tx) => {
          if (tx.data.type !== 'WithdrawWithTokenId') {
            return
          }
          return {
            assetType: tx.data.assetType,
            tokenId: tx.data.tokenId,
          }
        })
        .filter((i): i is { assetType: AssetHash; tokenId: bigint } => !!i) ??
      []
    const uniqueAssetHashes = [...new Set(assetHashes)]

    const [assetDetailsByHash, assetDetailsByTypeAndTokenId] =
      await Promise.all([
        this.assetRepository.getDetailsByAssetHashes(uniqueAssetHashes),
        this.assetRepository.getDetailsByAssetTypeAndTokenIds(
          assetTypeAndTokenIds
        ),
      ])
    const assetDetails = uniqBy(
      [...assetDetailsByHash, ...assetDetailsByTypeAndTokenId],
      (d) => d.assetHash
    )

    return new AssetDetailsMap(assetDetails)
  }

  getUserTransactionAssetHash(
    userTransaction: UserTransactionRecord
  ): AssetHash | undefined {
    switch (userTransaction.data.type) {
      case 'Withdraw':
      case 'FinalizeEscape':
        return userTransaction.data.assetType
      case 'WithdrawWithTokenId':
      case 'MintWithdraw':
        return userTransaction.data.assetId
      case 'ForcedTrade':
      case 'ForcedWithdrawal':
      case 'FullWithdrawal':
      case 'EscapeVerified':
        return undefined
      default:
        assertUnreachable(userTransaction.data)
    }
  }
}
