import {
  renderUserAssetsPage,
  renderUserBalanceChangesPage,
  renderUserOffersPage,
  renderUserPage,
  renderUserRecoverPage,
  renderUserTransactionsPage,
  TransactionEntry,
  UserAssetEntry,
} from '@explorer/frontend'
import { UserBalanceChangeEntry } from '@explorer/frontend/src/view/pages/user/components/UserBalanceChangesTable'
import {
  isPageContextUserDefined,
  TradingMode,
  UserDetails,
} from '@explorer/shared'
import { AssetHash, AssetId, EthereumAddress, StarkKey } from '@explorer/types'

import { CollateralAsset } from '../../config/starkex/StarkexConfig'
import { AssetDetailsMap } from '../../core/AssetDetailsMap'
import { AssetDetailsService } from '../../core/AssetDetailsService'
import { ForcedTradeOfferViewService } from '../../core/ForcedTradeOfferViewService'
import { PageContextService } from '../../core/PageContextService'
import { PaginationOptions } from '../../model/PaginationOptions'
import { ForcedTradeOfferRepository } from '../../peripherals/database/ForcedTradeOfferRepository'
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
import { WithdrawableAssetRepository } from '../../peripherals/database/WithdrawableAssetRepository'
import { ControllerResult } from './ControllerResult'
import { sentTransactionToEntry } from './sentTransactionToEntry'
import { userTransactionToEntry } from './userTransactionToEntry'
import { getAssetValueUSDCents } from './utils/toPositionAssetEntries'

export class UserController {
  constructor(
    private readonly pageContextService: PageContextService,
    private readonly assetDetailsService: AssetDetailsService,
    private readonly preprocessedAssetHistoryRepository: PreprocessedAssetHistoryRepository<
      AssetHash | AssetId
    >,
    private readonly sentTransactionRepository: SentTransactionRepository,
    private readonly userTransactionRepository: UserTransactionRepository,
    private readonly forcedTradeOfferRepository: ForcedTradeOfferRepository,
    private readonly userRegistrationEventRepository: UserRegistrationEventRepository,
    private readonly forcedTradeOfferViewService: ForcedTradeOfferViewService,
    private readonly withdrawableAssetRepository: WithdrawableAssetRepository,
    private readonly tradingMode: TradingMode,
    private readonly exchangeAddress: EthereumAddress,
    private readonly collateralAsset?: CollateralAsset
  ) {}

  async getUserRecoverPage(
    givenUser: Partial<UserDetails>
  ): Promise<ControllerResult> {
    const context = await this.pageContextService.getPageContext(givenUser)

    if (!isPageContextUserDefined(context)) {
      return { type: 'not found', content: 'Wallet not connect' }
    }

    if (context.user.starkKey) {
      return {
        type: 'redirect',
        url: `/users/${context.user.starkKey.toString()}`,
      }
    }

    const content = renderUserRecoverPage({
      context,
    })

    return { type: 'success', content }
  }

  async getUserPage(
    givenUser: Partial<UserDetails>,
    starkKey: StarkKey
  ): Promise<ControllerResult> {
    const paginationOpts = {
      offset: 0,
      limit: 10,
    }
    const [
      context,
      registeredUser,
      userAssets,
      totalAssets,
      history,
      historyCount,
      sentTransactions,
      userTransactions,
      userTransactionsCount,
      forcedTradeOffers,
      forcedTradeOffersCount,
      withdrawableAssets,
    ] = await Promise.all([
      this.pageContextService.getPageContext(givenUser),
      this.userRegistrationEventRepository.findByStarkKey(starkKey),
      this.preprocessedAssetHistoryRepository.getCurrentByStarkKeyPaginated(
        starkKey,
        paginationOpts,
        this.collateralAsset?.assetId
      ),
      this.preprocessedAssetHistoryRepository.getCountOfCurrentByStarkKey(
        starkKey
      ),
      this.preprocessedAssetHistoryRepository.getByStarkKeyPaginated(
        starkKey,
        paginationOpts
      ),
      this.preprocessedAssetHistoryRepository.getCountByStarkKey(starkKey),
      this.sentTransactionRepository.getByStarkKey(starkKey),
      this.userTransactionRepository.getByStarkKey(
        starkKey,
        undefined,
        paginationOpts
      ),
      this.userTransactionRepository.getCountByStarkKey(starkKey),
      this.forcedTradeOfferRepository.getByMakerOrTakerStarkKey(
        starkKey,
        paginationOpts
      ),
      this.forcedTradeOfferRepository.countByMakerOrTakerStarkKey(starkKey),
      this.withdrawableAssetRepository.getAssetBalancesByStarkKey(starkKey),
    ])

    const assetDetailsMap = await this.assetDetailsService.getAssetDetailsMap({
      userAssets: userAssets,
      assetHistory: history,
      sentTransactions,
      userTransactions,
      withdrawableAssets,
    })

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
    const offers =
      await this.forcedTradeOfferViewService.forcedTradeOffersToEntriesWithFullHistory(
        forcedTradeOffers,
        starkKey
      )
    const content = renderUserPage({
      context,
      tradingMode: this.tradingMode,
      starkKey,
      ethereumAddress: registeredUser?.ethAddress,
      withdrawableAssets: withdrawableAssets.map((asset) => ({
        asset: {
          hashOrId: asset.assetHash,
          details: assetDetailsMap?.getByAssetHash(asset.assetHash),
        },
        amount: asset.withdrawableBalance,
      })),
      exchangeAddress: this.exchangeAddress,
      offersToAccept: [],
      assets: assetEntries,
      totalAssets,
      balanceChanges: balanceChangesEntries,
      totalBalanceChanges: historyCount,
      transactions,
      totalTransactions,
      offers,
      totalOffers: forcedTradeOffersCount,
    })

    return { type: 'success', content }
  }

  async getUserAssetsPage(
    givenUser: Partial<UserDetails>,
    starkKey: StarkKey,
    pagination: PaginationOptions
  ): Promise<ControllerResult> {
    const [context, userAssets, total] = await Promise.all([
      this.pageContextService.getPageContext(givenUser),
      this.preprocessedAssetHistoryRepository.getCurrentByStarkKeyPaginated(
        starkKey,
        pagination,
        this.collateralAsset?.assetId
      ),
      this.preprocessedAssetHistoryRepository.getCountOfCurrentByStarkKey(
        starkKey
      ),
    ])

    const assetDetailsMap = await this.assetDetailsService.getAssetDetailsMap({
      userAssets: userAssets,
    })

    const assets = userAssets.map((a) =>
      toUserAssetEntry(
        a,
        this.tradingMode,
        this.collateralAsset?.assetId,
        assetDetailsMap
      )
    )

    const content = renderUserAssetsPage({
      context,
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
    const [context, history, total] = await Promise.all([
      this.pageContextService.getPageContext(givenUser),
      this.preprocessedAssetHistoryRepository.getByStarkKeyPaginated(
        starkKey,
        pagination
      ),
      this.preprocessedAssetHistoryRepository.getCountByStarkKey(starkKey),
    ])

    const assetDetailsMap = await this.assetDetailsService.getAssetDetailsMap({
      assetHistory: history,
    })

    const balanceChanges = history.map((h) =>
      toUserBalanceChangeEntries(h, assetDetailsMap)
    )

    const content = renderUserBalanceChangesPage({
      context,
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
    const [context, sentTransactions, userTransactions, userTransactionsCount] =
      await Promise.all([
        this.pageContextService.getPageContext(givenUser),
        this.sentTransactionRepository.getByStarkKey(starkKey),
        this.userTransactionRepository.getByStarkKey(
          starkKey,
          undefined,
          pagination
        ),
        this.userTransactionRepository.getCountByStarkKey(starkKey),
      ])

    const assetDetailsMap = await this.assetDetailsService.getAssetDetailsMap({
      sentTransactions,
      userTransactions,
    })

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
      context,
      starkKey,
      transactions,
      ...pagination,
      total: totalTransactions,
    })

    return { type: 'success', content }
  }

  async getUserOffersPage(
    givenUser: Partial<UserDetails>,
    starkKey: StarkKey,
    pagination: PaginationOptions
  ): Promise<ControllerResult> {
    const [context, forcedTradeOffers, forcedTradeOffersCount] =
      await Promise.all([
        this.pageContextService.getPageContext(givenUser),
        this.forcedTradeOfferRepository.getByMakerOrTakerStarkKey(
          starkKey,
          pagination
        ),
        this.forcedTradeOfferRepository.countByMakerOrTakerStarkKey(starkKey),
      ])

    const offers =
      await this.forcedTradeOfferViewService.forcedTradeOffersToEntriesWithFullHistory(
        forcedTradeOffers,
        starkKey
      )

    const content = renderUserOffersPage({
      context,
      starkKey,
      offers,
      ...pagination,
      total: forcedTradeOffersCount,
    })
    return { type: 'success', content }
  }
}

function toUserAssetEntry(
  asset: PreprocessedAssetHistoryRecord,
  tradingMode: TradingMode,
  collateralAssetId?: AssetId,
  assetDetailsMap?: AssetDetailsMap
): UserAssetEntry {
  return {
    asset: {
      hashOrId: asset.assetHashOrId,
      details: AssetHash.check(asset.assetHashOrId)
        ? assetDetailsMap?.getByAssetHash(asset.assetHashOrId)
        : undefined,
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
  record: PreprocessedAssetHistoryRecord,
  assetDetailsMap?: AssetDetailsMap
): UserBalanceChangeEntry {
  return {
    timestamp: record.timestamp,
    stateUpdateId: record.stateUpdateId.toString(),
    asset: {
      hashOrId: record.assetHashOrId,
      details: AssetHash.check(record.assetHashOrId)
        ? assetDetailsMap?.getByAssetHash(record.assetHashOrId)
        : undefined,
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
  assetDetailsMap?: AssetDetailsMap
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
