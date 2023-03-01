import {
  renderUserAssetsPage,
  renderUserBalanceChangesPage,
  renderUserPage,
  renderUserTransactionsPage,
  TransactionEntry,
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
import {
  SentTransactionRecord,
  SentTransactionRepository,
} from '../../peripherals/database/transactions/SentTransactionRepository'
import {
  UserTransactionRecord,
  UserTransactionRepository,
} from '../../peripherals/database/transactions/UserTransactionRepository'
import { UserRegistrationEventRepository } from '../../peripherals/database/UserRegistrationEventRepository'
import { ControllerResult } from './ControllerResult'
import { sentTransactionToEntry } from './sentTransactionToEntry'
import { userTransactionToEntry } from './userTransactionToEntry'
import { getAssetValueUSDCents } from './utils/toPositionAssetEntries'

export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly preprocessedAssetHistoryRepository: PreprocessedAssetHistoryRepository<
      AssetHash | AssetId
    >,
    private readonly sentTransactionRepository: SentTransactionRepository,
    private readonly userTransactionRepository: UserTransactionRepository,
    private readonly userRegistrationEventRepository: UserRegistrationEventRepository,
    private readonly tradingMode: 'perpetual' | 'spot',
    private readonly collateralAsset?: CollateralAsset
  ) {}

  async getUserPage(
    givenUser: Partial<UserDetails>,
    starkKey: StarkKey
  ): Promise<ControllerResult> {
    const [
      user,
      registeredUser,
      userAssets,
      totalAssets,
      history,
      historyCount,
      sentTransactions,
      userTransactions,
      userTransactionsCount,
    ] = await Promise.all([
      this.userService.getUserDetails(givenUser),
      this.userRegistrationEventRepository.findByStarkKey(starkKey),
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
      this.sentTransactionRepository.getByStarkKey(starkKey),
      this.userTransactionRepository.getByStarkKey(starkKey, undefined, {
        offset: 0,
        limit: 10,
      }),
      this.userTransactionRepository.getCountByStarkKey(starkKey),
    ])

    const assetEntries = userAssets.map((a) =>
      toUserAssetEntry(a, this.collateralAsset?.assetId)
    )

    const balanceChangesEntries = history.map(toUserBalanceChangeEntries)

    const transactions = buildUserTransactions(
      sentTransactions,
      userTransactions,
      this.collateralAsset
    )
    // TODO: include the count of sentTransactions
    const totalTransactions = userTransactionsCount

    const content = renderUserPage({
      user,
      type: this.tradingMode === 'perpetual' ? 'PERPETUAL' : 'SPOT',
      starkKey,
      ethereumAddress: registeredUser?.ethAddress ?? EthereumAddress.ZERO,
      withdrawableAssets: [],
      offersToAccept: [],
      assets: assetEntries,
      totalAssets,
      balanceChanges: balanceChangesEntries,
      totalBalanceChanges: historyCount,
      transactions,
      totalTransactions,
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

  async getUserTransactionsPage(
    givenUser: Partial<UserDetails>,
    starkKey: StarkKey,
    pagination: PaginationOptions
  ): Promise<ControllerResult> {
    const user = await this.userService.getUserDetails(givenUser)

    const [sentTransactions, userTransactions, userTransactionsCount] =
      await Promise.all([
        this.sentTransactionRepository.getByStarkKey(starkKey),
        this.userTransactionRepository.getByStarkKey(
          starkKey,
          undefined,
          pagination
        ),
        this.userTransactionRepository.getCountByStarkKey(starkKey),
      ])

    const transactions = buildUserTransactions(
      pagination.offset === 0 ? sentTransactions : [], // display sent transactions only on the first page
      userTransactions,
      this.collateralAsset
    )
    const totalTransactions =
      userTransactionsCount +
      sentTransactions.filter((t) => t.mined !== undefined && !t.mined.reverted)
        .length

    const content = renderUserTransactionsPage({
      user,
      starkKey,
      transactions,
      ...pagination,
      total: totalTransactions,
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
      asset.price !== undefined ? getAssetValueUSDCents(asset.balance, asset.price) : 0n, // temporary assumption of quantum=6
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

function buildUserTransactions(
  sentTransactions: SentTransactionRecord[],
  userTransactions: UserTransactionRecord[],
  collateralAsset?: CollateralAsset
): TransactionEntry[] {
  const sentEntries = sentTransactions
    // Mined non-reverted transactions will be inside userTransactions
    .filter((t) => t.mined === undefined || t.mined.reverted)
    .map((t) => sentTransactionToEntry(t, collateralAsset))

  const userEntries = userTransactions.map((t) =>
    userTransactionToEntry(t, collateralAsset)
  )

  return [...sentEntries, ...userEntries]
}
