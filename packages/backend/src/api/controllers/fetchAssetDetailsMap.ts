import { AssetDetails } from '@explorer/shared'
import { AssetHash } from '@explorer/types'

import { AssetRepository } from '../../peripherals/database/AssetRepository'
import { PreprocessedAssetHistoryRecord } from '../../peripherals/database/PreprocessedAssetHistoryRepository'
import { SentTransactionRecord } from '../../peripherals/database/transactions/SentTransactionRepository'
import { UserTransactionRecord } from '../../peripherals/database/transactions/UserTransactionRepository'

export async function fetchAssetDetailsMap(
  assetRepository: AssetRepository,
  records: {
    userAssets?: PreprocessedAssetHistoryRecord<AssetHash>[]
    assetHistory?: PreprocessedAssetHistoryRecord<AssetHash>[]
    sentTransactions?: SentTransactionRecord[]
    userTransactions?: UserTransactionRecord[]
  }
): Promise<Record<string, AssetDetails>> {
  const assetHashes: AssetHash[] = [
    // TODO add sentTransactions
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

  const uniqueHashes = [...new Set(assetHashes)]
  const assetDetails = await assetRepository.getDetailsByAssetHashes(
    uniqueHashes
  )
  const detailsByHashMap = assetDetails.reduce<Record<string, AssetDetails>>(
    (acc, assetDetail) => {
      acc[assetDetail.assetHash.toString()] = assetDetail
      return acc
    },
    {}
  )

  return detailsByHashMap
}
