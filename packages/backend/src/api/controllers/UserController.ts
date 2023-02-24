import {
  renderUserAssetsPage,
  renderUserBalanceChangesPage,
  renderUserPage,
  UserAssetEntry,
} from '@explorer/frontend'
import { UserBalanceChangeEntry } from '@explorer/frontend/src/view/pages/user/components/UserBalanceChangesTable'
import { UserDetails } from '@explorer/shared'
import { AssetHash, AssetId, EthereumAddress, StarkKey } from '@explorer/types'

import { CollateralAsset } from '../../config/starkex/StarkexConfig'
import { UserService } from '../../core/UserService'
import { PaginationOptions } from '../../model/PaginationOptions'
import {
  PreprocessedAssetHistoryRecord,
  PreprocessedAssetHistoryRepository,
} from '../../peripherals/database/PreprocessedAssetHistoryRepository'
import { UserTransactionRepository } from '../../peripherals/database/transactions/UserTransactionRepository'
import { ControllerResult } from './ControllerResult'

export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly preprocessedAssetHistoryRepository: PreprocessedAssetHistoryRepository<
      AssetHash | AssetId
    >,
    private readonly userTransactionRepository: UserTransactionRepository,
    private readonly tradingMode: 'perpetual' | 'spot',
    private readonly collateralAsset?: CollateralAsset
  ) {}

  async getUserPage(
    givenUser: Partial<UserDetails>,
    starkKey: StarkKey
  ): Promise<ControllerResult> {
    const user = await this.userService.getUserDetails(givenUser)

    const [userAssets, totalAssets, history, historyCount] = await Promise.all([
      this.preprocessedAssetHistoryRepository.getCurrentByStarkKeyPaginated(
        starkKey,
        { offset: 0, limit: 10 },
        this.collateralAsset?.assetId
      ),
      this.preprocessedAssetHistoryRepository.getCountOfCurrentByStarkKey(
        starkKey
      ),
      this.preprocessedAssetHistoryRepository.getByStarkKeyPaginated(starkKey, {
        offset: 0,
        limit: 10,
      }),
      this.preprocessedAssetHistoryRepository.getCountByStarkKey(starkKey),
    ])

    const assetEntries = userAssets.map((a) =>
      toUserAssetEntry(a, this.collateralAsset?.assetId)
    )

    const balanceChangesEntries = history.map(toUserBalanceChangeEntries)

    const content = renderUserPage({
      user,
      type: this.tradingMode === 'perpetual' ? 'PERPETUAL' : 'SPOT',
      starkKey,
      ethereumAddress: EthereumAddress.ZERO,
      withdrawableAssets: [],
      offersToAccept: [],
      assets: assetEntries,
      totalAssets,
      balanceChanges: balanceChangesEntries,
      totalBalanceChanges: historyCount,
      transactions: [],
      totalTransactions: 0,
      offers: [],
      totalOffers: 0,
    })

    return { type: 'success', content }
  }

  async getUserAssetsPage(
    givenUser: Partial<UserDetails>,
    starkKey: StarkKey,
    pagination: PaginationOptions
  ): Promise<ControllerResult> {
    const user = await this.userService.getUserDetails(givenUser)

    const [userAssets, total] = await Promise.all([
      this.preprocessedAssetHistoryRepository.getCurrentByStarkKeyPaginated(
        starkKey,
        pagination,
        this.collateralAsset?.assetId
      ),
      this.preprocessedAssetHistoryRepository.getCountOfCurrentByStarkKey(
        starkKey
      ),
    ])

    const assets = userAssets.map((a) =>
      toUserAssetEntry(a, this.collateralAsset?.assetId)
    )

    const content = renderUserAssetsPage({
      user,
      type: this.tradingMode === 'perpetual' ? 'PERPETUAL' : 'SPOT',
      starkKey,
      assets,
      ...pagination,
      total,
    })
    return { type: 'success', content }
  }

  async getUserBalanceChangesPage(
    givenUser: Partial<UserDetails>,
    starkKey: StarkKey,
    pagination: PaginationOptions
  ): Promise<ControllerResult> {
    const user = await this.userService.getUserDetails(givenUser)

    const [history, total] = await Promise.all([
      this.preprocessedAssetHistoryRepository.getByStarkKeyPaginated(
        starkKey,
        pagination
      ),
      this.preprocessedAssetHistoryRepository.getCountByStarkKey(starkKey),
    ])

    const balanceChanges = history.map(toUserBalanceChangeEntries)

    const content = renderUserBalanceChangesPage({
      user,
      type: this.tradingMode === 'perpetual' ? 'PERPETUAL' : 'SPOT',
      starkKey,
      balanceChanges,
      ...pagination,
      total,
    })

    return { type: 'success', content }
  }
}

function toUserAssetEntry(
  asset: PreprocessedAssetHistoryRecord<AssetHash | AssetId>,
  collateralAssetId?: AssetId
): UserAssetEntry {
  return {
    asset: { hashOrId: asset.assetHashOrId },
    balance: asset.balance,
    value:
      asset.price !== undefined ? asset.price * (asset.balance / 1000000n) : 0n, // temporary assumption of quantum=6
    vaultOrPositionId: asset.positionOrVaultId.toString(),
    action: asset.assetHashOrId === collateralAssetId ? 'WITHDRAW' : 'CLOSE',
  }
}

function toUserBalanceChangeEntries(
  record: PreprocessedAssetHistoryRecord<AssetHash | AssetId>
): UserBalanceChangeEntry {
  return {
    timestamp: record.timestamp,
    stateUpdateId: record.stateUpdateId.toString(),
    asset: { hashOrId: record.assetHashOrId },
    balance: record.balance,
    change: record.balance - record.prevBalance,
    vaultOrPositionId: record.positionOrVaultId.toString(),
  }
}
