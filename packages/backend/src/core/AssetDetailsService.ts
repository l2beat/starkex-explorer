import { assertUnreachable, TradingMode } from '@explorer/shared'
import { AssetHash, Hash256 } from '@explorer/types'

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
  }): Promise<AssetDetailsMap | undefined> {
    if (this.tradingMode !== 'spot') {
      return undefined
    }

    const assetHashes: (AssetHash | Hash256)[] = [
      ...(records.sentTransactions?.map((tx) =>
        this.getSentTransactionAssetIdentifiers(tx)
      ) ?? []),
      ...(records.userAssets?.map((a) => a.assetHashOrId) ?? []),
      ...(records.assetHistory?.map((a) => a.assetHashOrId) ?? []),
      ...(records.userTransactions?.map((tx) =>
        this.getUserTransactionAssetIdentifiers(tx)
      ) ?? []),
    ].filter(
      (i): i is AssetHash | Hash256 => AssetHash.check(i) || Hash256.check(i)
    )

    const uniqueAssetHashes = [...new Set(assetHashes)]
    const assetDetails =
      await this.assetRepository.getDetailsByAssetHashesOrTypeHashes(
        uniqueAssetHashes
      )

    return new AssetDetailsMap(assetDetails)
  }

  getSentTransactionAssetIdentifiers(
    sentTransaction: SentTransactionRecord
  ): AssetHash | Hash256 | undefined {
    switch (sentTransaction.data.type) {
      case 'Withdraw':
      case 'WithdrawWithTokenId':
        return sentTransaction.data.assetType
      case 'ForcedWithdrawal':
      case 'ForcedTrade':
        return undefined
      default:
        assertUnreachable(sentTransaction.data)
    }
  }

  getUserTransactionAssetIdentifiers(
    userTransaction: UserTransactionRecord
  ): AssetHash | undefined {
    switch (userTransaction.data.type) {
      case 'Withdraw':
        return userTransaction.data.assetType
      case 'WithdrawWithTokenId':
      case 'MintWithdraw':
        return userTransaction.data.assetId
      case 'ForcedTrade':
      case 'ForcedWithdrawal':
      case 'FullWithdrawal':
        return undefined
      default:
        assertUnreachable(userTransaction.data)
    }
  }
}
