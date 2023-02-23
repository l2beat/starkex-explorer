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
import { ControllerResult } from './ControllerResult'

export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly preprocessedAssetHistoryRepository: PreprocessedAssetHistoryRepository<
      AssetHash | AssetId
    >,
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

    const assets = toUserAssetEntries(userAssets, this.collateralAsset?.assetId)

    const balanceChanges = toUserBalanceChangeEntries(history)

    const content = renderUserPage({
      user,
      type: 'PERPETUAL',
      starkKey,
      ethereumAddress: EthereumAddress.ZERO,
      withdrawableAssets: [],
      offersToAccept: [],
      assets,
      totalAssets,
      balanceChanges,
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

    const assets = toUserAssetEntries(userAssets, this.collateralAsset?.assetId)

    const content = renderUserAssetsPage({
      user,
      type: 'PERPETUAL',
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

    const balanceChanges = toUserBalanceChangeEntries(history)

    const content = renderUserBalanceChangesPage({
      user,
      type: 'PERPETUAL',
      starkKey,
      balanceChanges,
      ...pagination,
      total,
    })

    return { type: 'success', content }
  }
}

function toUserAssetEntries(
  userAssets: PreprocessedAssetHistoryRecord<AssetHash | AssetId>[],
  collateralAssetId?: AssetId
): UserAssetEntry[] {
  return userAssets.map(
    (r): UserAssetEntry => ({
      asset: { hashOrId: r.assetHashOrId },
      balance: r.balance,
      value: r.price !== undefined ? r.price * (r.balance / 1000000n) : 0n, // temporary assumption of quantum=6
      vaultOrPositionId: r.positionOrVaultId.toString(),
      action: r.assetHashOrId === collateralAssetId ? 'WITHDRAW' : 'CLOSE',
    })
  )
}

function toUserBalanceChangeEntries(
  history: PreprocessedAssetHistoryRecord<AssetHash | AssetId>[]
): UserBalanceChangeEntry[] {
  return history.map(
    (r): UserBalanceChangeEntry => ({
      timestamp: r.timestamp,
      stateUpdateId: r.stateUpdateId.toString(),
      asset: { hashOrId: r.assetHashOrId },
      balance: r.balance,
      change: r.balance - r.prevBalance,
      vaultOrPositionId: r.positionOrVaultId.toString(),
    })
  )
}
