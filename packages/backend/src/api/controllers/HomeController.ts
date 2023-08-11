import {
  renderHomeL2TransactionsPage,
  renderHomePage,
  renderHomeStateUpdatesPage,
  renderHomeTransactionsPage,
} from '@explorer/frontend'
import { UserDetails } from '@explorer/shared'

import { L2TransactionTypesToExclude } from '../../config/starkex/StarkexConfig'
import { AssetDetailsService } from '../../core/AssetDetailsService'
import { ForcedTradeOfferViewService } from '../../core/ForcedTradeOfferViewService'
import { PageContextService } from '../../core/PageContextService'
import { PaginationOptions } from '../../model/PaginationOptions'
import { ForcedTradeOfferRepository } from '../../peripherals/database/ForcedTradeOfferRepository'
import { L2TransactionRepository } from '../../peripherals/database/L2TransactionRepository'
import { sumUpTransactionCount } from '../../peripherals/database/PreprocessedL2TransactionsStatistics'
import { PreprocessedStateDetailsRepository } from '../../peripherals/database/PreprocessedStateDetailsRepository'
import { UserTransactionData } from '../../peripherals/database/transactions/UserTransaction'
import { UserTransactionRepository } from '../../peripherals/database/transactions/UserTransactionRepository'
import { ControllerResult } from './ControllerResult'
import { l2TransactionToEntry } from './l2TransactionToEntry'
import { userTransactionToEntry } from './userTransactionToEntry'

const FORCED_TRANSACTION_TYPES: UserTransactionData['type'][] = [
  'ForcedWithdrawal',
  'ForcedTrade',
  'FullWithdrawal',
  'VerifyEscape',
  'FinalizeEscape',
  'FreezeRequest',
]

export class HomeController {
  constructor(
    private readonly pageContextService: PageContextService,
    private readonly assetDetailsService: AssetDetailsService,
    private readonly forcedTradeOfferViewService: ForcedTradeOfferViewService,
    private readonly userTransactionRepository: UserTransactionRepository,
    private readonly forcedTradeOfferRepository: ForcedTradeOfferRepository,
    private readonly l2TransactionRepository: L2TransactionRepository,
    private readonly preprocessedStateDetailsRepository: PreprocessedStateDetailsRepository,
    private readonly excludeL2TransactionTypes:
      | L2TransactionTypesToExclude
      | undefined
  ) {}

  async getHomePage(
    givenUser: Partial<UserDetails>
  ): Promise<ControllerResult> {
    const context = await this.pageContextService.getPageContext(givenUser)

    const [
      l2Transactions,
      lastStateDetailsWithL2TransactionsStatistics,
      liveL2TransactionsStatistics,
      stateUpdates,
      stateUpdatesCount,
      forcedUserTransactions,
      forcedUserTransactionsCount,
      availableOffers,
      offersCount,
    ] = await Promise.all([
      this.l2TransactionRepository.getPaginatedWithoutMulti(
        { offset: 0, limit: 8 },
        this.excludeL2TransactionTypes
      ),
      this.preprocessedStateDetailsRepository.findLastWithL2TransactionsStatistics(),
      this.l2TransactionRepository.getLiveStatistics(),
      this.preprocessedStateDetailsRepository.getPaginated({
        offset: 0,
        limit: 25,
      }),
      this.preprocessedStateDetailsRepository.countAll(),
      this.userTransactionRepository.getPaginated({
        offset: 0,
        limit: 4,
        types: FORCED_TRANSACTION_TYPES,
      }),
      this.userTransactionRepository.countAll(FORCED_TRANSACTION_TYPES),
      this.forcedTradeOfferRepository.getAvailablePaginated({
        offset: 0,
        limit: 4,
      }),
      this.forcedTradeOfferRepository.countAll(),
    ])

    const assetDetailsMap = await this.assetDetailsService.getAssetDetailsMap({
      userTransactions: forcedUserTransactions,
    })

    const collateralAsset = this.pageContextService.getCollateralAsset(context)
    const forcedTransactionEntries = forcedUserTransactions.map((t) =>
      userTransactionToEntry(t, collateralAsset, assetDetailsMap)
    )

    const stateUpdateEntries = stateUpdates.map((update) => ({
      timestamp: update.timestamp,
      id: update.stateUpdateId.toString(),
      hash: update.stateTransitionHash,
      updateCount: update.assetUpdateCount,
      forcedTransactionCount: update.forcedTransactionCount,
    }))

    const totalL2Transactions =
      sumUpTransactionCount(
        lastStateDetailsWithL2TransactionsStatistics?.cumulativeL2TransactionsStatistics,
        this.excludeL2TransactionTypes
      ) +
      sumUpTransactionCount(
        liveL2TransactionsStatistics,
        this.excludeL2TransactionTypes
      )

    const statistics = {
      stateUpdateCount: stateUpdatesCount,
      l2TransactionCount: totalL2Transactions,
      forcedTransactionCount: forcedUserTransactionsCount,
      offerCount: offersCount,
    }

    const content = renderHomePage({
      context,
      tutorials: [], // explicitly no tutorials
      l2Transactions: l2Transactions.map(l2TransactionToEntry),
      statistics,
      stateUpdates: stateUpdateEntries,
      forcedTransactions: forcedTransactionEntries,
      offers: availableOffers.map((offer) =>
        this.forcedTradeOfferViewService.toOfferEntry(offer)
      ),
    })
    return { type: 'success', content }
  }

  async getHomeL2TransactionsPage(
    givenUser: Partial<UserDetails>,
    pagination: PaginationOptions
  ): Promise<ControllerResult> {
    const context = await this.pageContextService.getPageContext(givenUser)

    const [
      l2Transactions,
      lastStateDetailsWithL2TransactionsStatistics,
      liveL2TransactionsStatistics,
    ] = await Promise.all([
      this.l2TransactionRepository.getPaginatedWithoutMulti(
        pagination,
        this.excludeL2TransactionTypes
      ),
      this.preprocessedStateDetailsRepository.findLastWithL2TransactionsStatistics(),
      this.l2TransactionRepository.getLiveStatistics(),
    ])

    const totalL2Transactions =
      sumUpTransactionCount(
        lastStateDetailsWithL2TransactionsStatistics?.cumulativeL2TransactionsStatistics,
        this.excludeL2TransactionTypes
      ) +
      sumUpTransactionCount(
        liveL2TransactionsStatistics,
        this.excludeL2TransactionTypes
      )

    const content = renderHomeL2TransactionsPage({
      context,
      l2Transactions: l2Transactions.map(l2TransactionToEntry),
      total: totalL2Transactions,
      ...pagination,
    })
    return { type: 'success', content }
  }

  async getHomeStateUpdatesPage(
    givenUser: Partial<UserDetails>,
    pagination: PaginationOptions
  ): Promise<ControllerResult> {
    const context = await this.pageContextService.getPageContext(givenUser)

    const [total, stateUpdates] = await Promise.all([
      this.preprocessedStateDetailsRepository.countAll(),
      this.preprocessedStateDetailsRepository.getPaginated(pagination),
    ])

    const stateUpdateEntries = stateUpdates.map((update) => ({
      timestamp: update.timestamp,
      id: update.stateUpdateId.toString(),
      hash: update.stateTransitionHash,
      updateCount: update.assetUpdateCount,
      forcedTransactionCount: update.forcedTransactionCount,
    }))

    const content = renderHomeStateUpdatesPage({
      context,
      stateUpdates: stateUpdateEntries,
      ...pagination,
      total,
    })
    return { type: 'success', content }
  }

  async getHomeForcedTransactionsPage(
    givenUser: Partial<UserDetails>,
    pagination: PaginationOptions
  ): Promise<ControllerResult> {
    const context = await this.pageContextService.getPageContext(givenUser)

    const [forcedUserTransactions, forcedUserTransactionsCount] =
      await Promise.all([
        this.userTransactionRepository.getPaginated({
          ...pagination,
          types: FORCED_TRANSACTION_TYPES,
        }),
        this.userTransactionRepository.countAll(FORCED_TRANSACTION_TYPES),
      ])

    const assetDetailsMap = await this.assetDetailsService.getAssetDetailsMap({
      userTransactions: forcedUserTransactions,
    })

    const collateralAsset = this.pageContextService.getCollateralAsset(context)
    const transactions = forcedUserTransactions.map((t) =>
      userTransactionToEntry(t, collateralAsset, assetDetailsMap)
    )

    const content = renderHomeTransactionsPage({
      context,
      forcedTransactions: transactions,
      total: forcedUserTransactionsCount,
      ...pagination,
    })

    return { type: 'success', content }
  }
}
