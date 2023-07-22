import {
  EscapableAssetEntry,
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
  PageContext,
  TradingMode,
  UserDetails,
} from '@explorer/shared'
import { AssetHash, AssetId, EthereumAddress, StarkKey } from '@explorer/types'
import uniqBy from 'lodash/uniqBy'

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
import { sumUpTransactionCount } from '../../peripherals/database/PreprocessedL2TransactionsStatistics'
import { PreprocessedUserL2TransactionsStatisticsRepository } from '../../peripherals/database/PreprocessedUserL2TransactionsStatisticsRepository'
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
import { l2TransactionToEntry } from './l2TransactionToEntry'
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
    private readonly preprocessedUserL2TransactionsStatisticsRepository: PreprocessedUserL2TransactionsStatisticsRepository,
    private readonly exchangeAddress: EthereumAddress
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
      return {
        type: 'not found',
        message: 'You have to connect a wallet to access this page',
      }
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
      preprocessedUserL2TransactionsStatistics,
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
      this.preprocessedUserL2TransactionsStatisticsRepository.findLatestByStarkKey(
        starkKey
      ),
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
      return {
        type: 'not found',
        message: `User with starkKey ${starkKey.toString()} not found`,
      }
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

    const escapableAssets = await this.getEscapableAssets(
      context,
      starkKey,
      collateralAsset
    )

    const content = renderUserPage({
      context,
      starkKey,
      ethereumAddress: registeredUser?.ethAddress,
      l2Transactions: l2Transactions.map(l2TransactionToEntry),
      totalL2Transactions: sumUpTransactionCount(
        preprocessedUserL2TransactionsStatistics?.cumulativeL2TransactionsStatistics
      ),
      escapableAssets: escapableAssets.finalizable,
      withdrawableAssets: withdrawableAssets.map((asset) => ({
        asset: {
          hashOrId:
            collateralAsset?.assetHash === asset.assetHash
              ? collateralAsset.assetId
              : asset.assetHash,
          details:
            context.tradingMode === 'perpetual'
              ? collateralAssetDetails(context.collateralAsset)
              : assetDetailsMap?.getByAssetHash(asset.assetHash),
        },
        amount: asset.withdrawableBalance,
      })),
      exchangeAddress: this.exchangeAddress,
      finalizableOffers: finalizableOffers.map((offer) =>
        this.forcedTradeOfferViewService.toFinalizableOfferEntry(offer)
      ),
      assets: escapableAssets.allCount > 0 ? [] : assetEntries, // When frozen and escaped, don't show assets
      totalAssets: escapableAssets.allCount > 0 ? 0 : userStatistics.assetCount,
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
      return {
        type: 'not found',
        message: `User with starkKey ${starkKey.toString()} not found`,
      }
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
    const [l2Transactions, preprocessedUserL2TransactionsStatistics] =
      await Promise.all([
        this.l2TransactionRepository.getUserSpecificPaginated(
          starkKey,
          pagination
        ),
        this.preprocessedUserL2TransactionsStatisticsRepository.findLatestByStarkKey(
          starkKey
        ),
      ])

    const content = renderUserL2TransactionsPage({
      context,
      starkKey,
      l2Transactions: l2Transactions.map(l2TransactionToEntry),
      total: sumUpTransactionCount(
        preprocessedUserL2TransactionsStatistics?.cumulativeL2TransactionsStatistics
      ),
      ...pagination,
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
      return {
        type: 'not found',
        message: `User with starkKey ${starkKey.toString()} not found`,
      }
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
      return { type: 'not found' }
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

  async getEscapableAssets(
    context: PageContext,
    starkKey: StarkKey,
    collateralAsset?: CollateralAsset
  ): Promise<{
    finalizable: EscapableAssetEntry[]
    allCount: number
  }> {
    if (
      context.freezeStatus !== 'frozen' ||
      context.tradingMode !== 'perpetual' ||
      collateralAsset === undefined
    ) {
      return { finalizable: [], allCount: 0 }
    }
    const allEscapeVerifiedTransactions =
      await this.userTransactionRepository.getByStarkKey(starkKey, [
        'EscapeVerified',
      ])

    if (allEscapeVerifiedTransactions.length === 0) {
      return { finalizable: [], allCount: 0 }
    }

    const uniqueEscapeVerifiedTransactions = uniqBy(
      allEscapeVerifiedTransactions,
      (t) => t.data.positionId
    )
    const oldestBlockNumber = Math.min(
      ...uniqueEscapeVerifiedTransactions.map((t) => t.blockNumber)
    )
    const withdrawalEventsFromBlockNumber =
      await this.withdrawableAssetRepository.getByStarkKeyFromBlockNumber(
        starkKey,
        oldestBlockNumber
      )
    // For each transaction in uniqueEscapeVerifiedTransactions check if there is a corresponding withdrawal event
    // in withdrawalEventsFromBlockNumber where asset and amount match.
    // If found, remove the transaction from the uniqueEscapeVerifiedTransactions.
    // This is the only way to find out if an escape has been finalized.
    // Since the exchange is frozen, there can be no new other withdrawal events.
    const notFinalizedEscapableTransactions =
      uniqueEscapeVerifiedTransactions.filter((t) => {
        const correspondingWithdrawalEvent =
          withdrawalEventsFromBlockNumber.find((w) => {
            return (
              w.data.type === 'WithdrawalAllowed' &&
              w.assetHash === collateralAsset.assetHash &&
              w.data.quantizedAmount === t.data.withdrawalAmount
            )
          })
        return correspondingWithdrawalEvent === undefined
      })

    const finalizable = notFinalizedEscapableTransactions.map((t) => ({
      asset: {
        hashOrId: collateralAsset.assetId,
        details: collateralAssetDetails(collateralAsset),
      },
      ownerStarkKey: t.data.starkKey,
      positionOrVaultId: t.data.positionId,
      amount: t.data.withdrawalAmount,
    }))

    return {
      finalizable,
      allCount: allEscapeVerifiedTransactions.length,
    }
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

const collateralAssetDetails = (collateralAsset: CollateralAsset) =>
  ERC20Details.parse({
    assetHash: collateralAsset.assetHash,
    assetTypeHash: collateralAsset.assetHash,
    type: 'ERC20',
    quantum: AssetId.decimals(collateralAsset.assetId).toString(),
    contractError: [],
    address: EthereumAddress.ZERO,
    name: AssetId.symbol(collateralAsset.assetId),
    symbol: AssetId.symbol(collateralAsset.assetId),
    decimals: 2,
  })
