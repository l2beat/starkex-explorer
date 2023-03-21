import { TradingMode } from '@explorer/shared'
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
    if (this.tradingMode === 'spot') {
      return undefined
    }

    const assetHashes: AssetHash[] = [
      ...(records.userAssets?.map((a) => a.assetHashOrId) ?? []),
      ...(records.assetHistory?.map((a) => a.assetHashOrId) ?? []),
      ...(records.userTransactions?.map((t) =>
        t.data.type === 'Withdraw'
          ? t.data.assetType
          : t.data.type === 'WithdrawWithTokenId' ||
            t.data.type === 'MintWithdraw'
          ? t.data.assetId
          : undefined
      ) ?? []),
    ].filter((i) => i !== undefined) as AssetHash[]

    const assetTypeHashes = (
      records.sentTransactions?.map((t) => {
        if (t.data.type === 'WithdrawWithTokenId') {
          return t.data.assetType
        }
      }) ?? []
    ).filter((i) => i !== undefined) as Hash256[]
    const uniqueAssetHashes = [...new Set(assetHashes)]
    const assetDetails = [
      ...(await this.assetRepository.getDetailsByAssetHashes(
        uniqueAssetHashes
      )),
      ...(await this.assetRepository.getDetailsByAssetTypeHashes(
        assetTypeHashes
      )),
    ]

    return new AssetDetailsMap(assetDetails)
  }
}
