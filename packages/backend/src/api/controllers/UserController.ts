import {
  renderUserAssetsPage,
  renderUserBalanceChangesPage,
  renderUserL2TransactionsPage,
  renderUserOffersPage,
  renderUserPage,
  renderUserRecoverPage,
  renderUserRegisterPage,
  renderUserTransactionsPage,
  TransactionEntry,
  UserAssetEntry,
} from '@explorer/frontend'
import { UserBalanceChangeEntry } from '@explorer/frontend/src/view/pages/user/components/UserBalanceChangesTable'
import {
  CollateralAsset,
  ERC20Details,
  TradingMode,
  UserDetails,
} from '@explorer/shared'
import { AssetHash, AssetId, EthereumAddress, StarkKey } from '@explorer/types'

import { AssetDetailsMap } from '../../core/AssetDetailsMap'
import { AssetDetailsService } from '../../core/AssetDetailsService'
import { ForcedTradeOfferViewService } from '../../core/ForcedTradeOfferViewService'
import { PageContextService } from '../../core/PageContextService'
import { PaginationOptions } from '../../model/PaginationOptions'
import { ForcedTradeOfferRepository } from '../../peripherals/database/ForcedTradeOfferRepository'
import { L2TransactionRepository } from '../../peripherals/database/L2TransactionRepository'
import {
  PreprocessedAssetHistoryRecord,
  PreprocessedAssetHistoryRepository,
} from '../../peripherals/database/PreprocessedAssetHistoryRepository'
import { PreprocessedUserStatisticsRepository } from '../../peripherals/database/PreprocessedUserStatisticsRepository'
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
import { getAssetValueUSDCents } from '../../utils/assets'
import { ControllerResult } from './ControllerResult'
import { sentTransactionToEntry } from './sentTransactionToEntry'
import { userTransactionToEntry } from './userTransactionToEntry'

export class UserController {
  constructor(
    private readonly pageContextService: PageContextService,
    private readonly assetDetailsService: AssetDetailsService,
    private readonly preprocessedAssetHistoryRepository: PreprocessedAssetHistoryRepository,
    private readonly sentTransactionRepository: SentTransactionRepository,
    private readonly userTransactionRepository: UserTransactionRepository,
    private readonly forcedTradeOfferRepository: ForcedTradeOfferRepository,
    private readonly l2TransactionRepository: L2TransactionRepository,
    private readonly userRegistrationEventRepository: UserRegistrationEventRepository,
    private readonly forcedTradeOfferViewService: ForcedTradeOfferViewService,
    private readonly withdrawableAssetRepository: WithdrawableAssetRepository,
    private readonly preprocessedUserStatisticsRepository: PreprocessedUserStatisticsRepository,
    private readonly exchangeAddress: EthereumAddress,
    private readonly showL2Transactions: boolean
  ) {}

  async getUserRegisterPage(
    givenUser: Partial<UserDetails>
  ): Promise<ControllerResult> {
    const context =
      await this.pageContextService.getPageContextWithUserAndStarkKey(givenUser)

    if (!context) {
      return { type: 'redirect', url: '/users/recover' }
    }

    const content = renderUserRegisterPage({
      context,
      exchangeAddress: this.exchangeAddress,
    })

    return { type: 'success', content }
  }

  async getUserRecoverPage(
    givenUser: Partial<UserDetails>
  ): Promise<ControllerResult> {
    const context = await this.pageContextService.getPageContextWithUser(
      givenUser
    )

    if (!context) {
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
    const context = await this.pageContextService.getPageContext(givenUser)
    const collateralAsset = this.pageContextService.getCollateralAsset(context)
    const paginationOpts = {
      offset: 0,
      limit: 10,
    }

    const [
      registeredUser,
      userAssets,
      history,
      l2Transactions,
      l2TransactionsCount,
      sentTransactions,
      userTransactions,
      userTransactionsCount,
      forcedTradeOffers,
      forcedTradeOffersCount,
      finalizableOffers,
      withdrawableAssets,
      userStatistics,
    ] = await Promise.all([
      this.userRegistrationEventRepository.findByStarkKey(starkKey),
      this.preprocessedAssetHistoryRepository.getCurrentByStarkKeyPaginated(
        starkKey,
        paginationOpts,
        collateralAsset?.assetId
      ),
      this.preprocessedAssetHistoryRepository.getByStarkKeyPaginated(
        starkKey,
        paginationOpts
      ),
      this.l2TransactionRepository.getUserSpecificPaginated(
        starkKey,
        paginationOpts
      ),
      this.l2TransactionRepository.countAllUserSpecific(starkKey),
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
      this.forcedTradeOfferRepository.getFinalizableByStarkKey(starkKey),
      this.withdrawableAssetRepository.getAssetBalancesByStarkKey(starkKey),
      this.preprocessedUserStatisticsRepository.findCurrentByStarkKey(starkKey),
    ])

    if (!userStatistics) {
      throw new Error(`Statistics for user ${starkKey.toString()} not found!`)
    }

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
        context.tradingMode,
        collateralAsset?.assetId,
        assetDetailsMap
      )
    )

    const balanceChangesEntries = history.map((h) =>
      toUserBalanceChangeEntries(h, assetDetailsMap)
    )

    const transactions = buildUserTransactions(
      sentTransactions,
      userTransactions,
      collateralAsset,
      assetDetailsMap
    )

    const totalTransactions = userTransactionsCount
    const offers =
      await this.forcedTradeOfferViewService.ToEntriesWithFullHistory(
        forcedTradeOffers,
        starkKey
      )

    const content = renderUserPage({
      context,
      starkKey,
      ethereumAddress: registeredUser?.ethAddress,
      l2Transactions: this.showL2Transactions
        ? {
            data: l2Transactions.map((t) => ({
              ...t,
              status: t.stateUpdateId ? 'INCLUDED' : 'PENDING',
            })),
            total: l2TransactionsCount,
          }
        : undefined,
      withdrawableAssets: withdrawableAssets.map((asset) => ({
        asset: {
          hashOrId:
            collateralAsset?.assetHash === asset.assetHash
              ? collateralAsset.assetId
              : asset.assetHash,
          details:
            context.tradingMode === 'perpetual'
              ? // TODO: this is a hack to get the regular withdrawals working for perpetuals
                // This should be revised mandatory in phase 2!
                ERC20Details.parse({
                  assetHash: context.collateralAsset.assetHash,
                  assetTypeHash: context.collateralAsset.assetHash,
                  type: 'ERC20',
                  quantum: AssetId.decimals(
                    context.collateralAsset.assetId
                  ).toString(),
                  contractError: [],
                  address: EthereumAddress.ZERO,
                  name: AssetId.symbol(context.collateralAsset.assetId),
                  symbol: AssetId.symbol(context.collateralAsset.assetId),
                  decimals: 2,
                })
              : assetDetailsMap?.getByAssetHash(asset.assetHash),
        },
        amount: asset.withdrawableBalance,
      })),
      exchangeAddress: this.exchangeAddress,
      finalizableOffers: finalizableOffers.map((offer) =>
        this.forcedTradeOfferViewService.toFinalizableOfferEntry(offer)
      ),
      assets: assetEntries,
      totalAssets: userStatistics.assetCount,
      balanceChanges: balanceChangesEntries,
      totalBalanceChanges: Number(userStatistics.balanceChangeCount), // TODO: don't cast
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
    const context = await this.pageContextService.getPageContext(givenUser)
    const collateralAsset = this.pageContextService.getCollateralAsset(context)
    const [userAssets, userStatistics] = await Promise.all([
      this.preprocessedAssetHistoryRepository.getCurrentByStarkKeyPaginated(
        starkKey,
        pagination,
        collateralAsset?.assetId
      ),
      this.preprocessedUserStatisticsRepository.findCurrentByStarkKey(starkKey),
    ])

    if (!userStatistics) {
      throw new Error(`Statistics for user ${starkKey.toString()} not found!`)
    }

    const assetDetailsMap = await this.assetDetailsService.getAssetDetailsMap({
      userAssets: userAssets,
    })

    const assets = userAssets.map((a) =>
      toUserAssetEntry(
        a,
        context.tradingMode,
        collateralAsset?.assetId,
        assetDetailsMap
      )
    )

    const content = renderUserAssetsPage({
      context,
      starkKey,
      assets,
      ...pagination,
      total: userStatistics.assetCount,
    })
    return { type: 'success', content }
  }

  async getUserL2TransactionsPage(
    givenUser: Partial<UserDetails>,
    starkKey: StarkKey,
    pagination: PaginationOptions
  ): Promise<ControllerResult> {
    const context = await this.pageContextService.getPageContext(givenUser)
    const [l2Transactions, l2TransactionsCount] = await Promise.all([
      this.l2TransactionRepository.getUserSpecificPaginated(
        starkKey,
        pagination
      ),
      this.l2TransactionRepository.countAllUserSpecific(starkKey),
    ])

    const content = renderUserL2TransactionsPage({
      context,
      starkKey,
      l2Transactions: l2Transactions.map((t) => ({
        ...t,
        status: t.stateUpdateId ? 'INCLUDED' : 'PENDING',
      })),
      ...pagination,
      total: l2TransactionsCount,
    })
    return { type: 'success', content }
  }

  async getUserBalanceChangesPage(
    givenUser: Partial<UserDetails>,
    starkKey: StarkKey,
    pagination: PaginationOptions
  ): Promise<ControllerResult> {
    const [context, history, userStatistics] = await Promise.all([
      this.pageContextService.getPageContext(givenUser),
      this.preprocessedAssetHistoryRepository.getByStarkKeyPaginated(
        starkKey,
        pagination
      ),
      this.preprocessedUserStatisticsRepository.findCurrentByStarkKey(starkKey),
    ])

    if (!userStatistics) {
      throw new Error(`Statistics for user ${starkKey.toString()} not found!`)
    }

    const assetDetailsMap = await this.assetDetailsService.getAssetDetailsMap({
      assetHistory: history,
    })

    const balanceChanges = history.map((h) =>
      toUserBalanceChangeEntries(h, assetDetailsMap)
    )

    const content = renderUserBalanceChangesPage({
      context,
      starkKey,
      balanceChanges,
      ...pagination,
      total: userStatistics.balanceChangeCount,
    })

    return { type: 'success', content }
  }

  async getUserTransactionsPage(
    givenUser: Partial<UserDetails>,
    starkKey: StarkKey,
    pagination: PaginationOptions
  ): Promise<ControllerResult> {
    const context = await this.pageContextService.getPageContext(givenUser)
    const collateralAsset = this.pageContextService.getCollateralAsset(context)
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

    const assetDetailsMap = await this.assetDetailsService.getAssetDetailsMap({
      sentTransactions,
      userTransactions,
    })

    const transactions = buildUserTransactions(
      pagination.offset === 0 ? sentTransactions : [], // display sent transactions only on the first page
      userTransactions,
      collateralAsset,
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
    if (context.tradingMode !== 'perpetual') {
      return { type: 'not found', content: 'Page not found' }
    }

    const offers =
      await this.forcedTradeOfferViewService.ToEntriesWithFullHistory(
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
