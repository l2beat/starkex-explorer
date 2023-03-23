import {
  renderUserAssetsPage,
  renderUserBalanceChangesPage,
  renderUserPage,
  renderUserRegisterPage,
  renderUserTransactionsPage,
  TransactionEntry,
  UserAssetEntry,
} from '@explorer/frontend'
import { UserBalanceChangeEntry } from '@explorer/frontend/src/view/pages/user/components/UserBalanceChangesTable'
import { AssetDetails, TradingMode, UserDetails } from '@explorer/shared'
import { AssetHash, AssetId, EthereumAddress, StarkKey } from '@explorer/types'

import { CollateralAsset } from '../../config/starkex/StarkexConfig'
import { UserService } from '../../core/UserService'
import { PaginationOptions } from '../../model/PaginationOptions'
import { AssetRepository } from '../../peripherals/database/AssetRepository'
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
import { getAssetHashToAssetDetailsMap } from './getAssetDetailsMap'
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
    private readonly assetRepository: AssetRepository,
    private readonly tradingMode: TradingMode,
    private readonly collateralAsset?: CollateralAsset
  ) {}

  getRegisterPage(givenUser: Partial<UserDetails>): ControllerResult {
    if (!givenUser.address) {
      return { type: 'not found', content: 'Wallet not connect' }
    }

    const content = renderUserRegisterPage({
      user: {
        address: givenUser.address,
      },
    })

    return { type: 'success', content }
  }

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

    const assetDetailsMap = await getAssetHashToAssetDetailsMap(
      this.tradingMode,
      this.assetRepository,
      {
        userAssets: userAssets,
        assetHistory: history,
        sentTransactions,
        userTransactions,
      }
    )

    const assetEntries = userAssets.map((a) =>
      toUserAssetEntry(
        a,
        this.tradingMode,
        this.collateralAsset?.assetId,
        assetDetailsMap
      )
    )

    const balanceChangesEntries = history.map((h) =>
      toUserBalanceChangeEntries(h, assetDetailsMap)
    )

    const transactions = buildUserTransactions(
      sentTransactions,
      userTransactions,
      this.collateralAsset,
      assetDetailsMap
    )
    // TODO: include the count of sentTransactions
    const totalTransactions = userTransactionsCount

    const content = renderUserPage({
      user,
      tradingMode: this.tradingMode,
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

    const assetDetailsMap = await getAssetHashToAssetDetailsMap(
      this.tradingMode,
      this.assetRepository,
      {
        userAssets: userAssets,
      }
    )

    const assets = userAssets.map((a) =>
      toUserAssetEntry(
        a,
        this.tradingMode,
        this.collateralAsset?.assetId,
        assetDetailsMap
      )
    )

    const content = renderUserAssetsPage({
      user,
      tradingMode: this.tradingMode,
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

    const assetDetailsMap = await getAssetHashToAssetDetailsMap(
      this.tradingMode,
      this.assetRepository,
      {
        assetHistory: history,
      }
    )
    const balanceChanges = history.map((h) =>
      toUserBalanceChangeEntries(h, assetDetailsMap)
    )

    const content = renderUserBalanceChangesPage({
      user,
      tradingMode: this.tradingMode,
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

    const assetDetailsMap = await getAssetHashToAssetDetailsMap(
      this.tradingMode,
      this.assetRepository,
      {
        sentTransactions,
        userTransactions,
      }
    )

    const transactions = buildUserTransactions(
      pagination.offset === 0 ? sentTransactions : [], // display sent transactions only on the first page
      userTransactions,
      this.collateralAsset,
      assetDetailsMap
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
  tradingMode: TradingMode,
  collateralAssetId?: AssetId,
  assetDetailsMap?: Record<string, AssetDetails>
): UserAssetEntry {
  return {
    asset: {
      hashOrId: asset.assetHashOrId,
      details: assetDetailsMap?.[asset.assetHashOrId.toString()],
    },
    balance: asset.balance,
    value:
      asset.price === undefined
        ? 0n
        : asset.assetHashOrId === collateralAssetId
        ? asset.balance / 10000n // TODO: use the correct decimals
        : getAssetValueUSDCents(asset.balance, asset.price),
    vaultOrPositionId: asset.positionOrVaultId.toString(),
    action:
      tradingMode === 'spot' || asset.assetHashOrId === collateralAssetId
        ? 'WITHDRAW'
        : 'CLOSE',
  }
}

function toUserBalanceChangeEntries(
  record: PreprocessedAssetHistoryRecord<AssetHash | AssetId>,
  assetDetailsMap?: Record<string, AssetDetails>
): UserBalanceChangeEntry {
  return {
    timestamp: record.timestamp,
    stateUpdateId: record.stateUpdateId.toString(),
    asset: {
      hashOrId: record.assetHashOrId,
      details: assetDetailsMap?.[record.assetHashOrId.toString()],
    },
    balance: record.balance,
    change: record.balance - record.prevBalance,
    vaultOrPositionId: record.positionOrVaultId.toString(),
  }
}

function buildUserTransactions(
  sentTransactions: SentTransactionRecord[],
  userTransactions: UserTransactionRecord[],
  collateralAsset?: CollateralAsset,
  assetDetailsMap?: Record<string, AssetDetails>
): TransactionEntry[] {
  const sentEntries = sentTransactions
    // Mined non-reverted transactions will be inside userTransactions
    .filter((t) => t.mined === undefined || t.mined.reverted)
    .map((t) => sentTransactionToEntry(t, collateralAsset, assetDetailsMap))

  const userEntries = userTransactions.map((t) =>
    userTransactionToEntry(t, collateralAsset, assetDetailsMap)
  )

  return [...sentEntries, ...userEntries]
}
