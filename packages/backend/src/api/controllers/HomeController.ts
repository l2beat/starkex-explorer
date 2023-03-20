import {
  renderHomePage,
  renderHomeStateUpdatesPage,
  renderHomeTransactionsPage,
} from '@explorer/frontend'
import { TradingMode, UserDetails } from '@explorer/shared'

import { CollateralAsset } from '../../config/starkex/StarkexConfig'
import { UserService } from '../../core/UserService'
import { PaginationOptions } from '../../model/PaginationOptions'
import { ForcedTradeOfferRepository } from '../../peripherals/database/ForcedTradeOfferRepository'
import { AssetRepository } from '../../peripherals/database/AssetRepository'
import { PreprocessedStateDetailsRepository } from '../../peripherals/database/PreprocessedStateDetailsRepository'
import { UserTransactionData } from '../../peripherals/database/transactions/UserTransaction'
import { UserTransactionRepository } from '../../peripherals/database/transactions/UserTransactionRepository'
import { ControllerResult } from './ControllerResult'
import { forcedTradeOfferToEntry } from './forcedTradeOfferToEntry'
import { getAssetHashToAssetDetailsMap } from './getAssetDetailsMap'
import { userTransactionToEntry } from './userTransactionToEntry'

const FORCED_TRANSACTION_TYPES: UserTransactionData['type'][] = [
  'ForcedWithdrawal',
  'ForcedTrade',
  'FullWithdrawal',
]

export class HomeController {
  constructor(
    private readonly userService: UserService,
    private readonly assetRepository: AssetRepository,
    private readonly userTransactionRepository: UserTransactionRepository,
    private readonly forcedTradeOfferRepository: ForcedTradeOfferRepository,
    private readonly preprocessedStateDetailsRepository: PreprocessedStateDetailsRepository,
    private readonly tradingMode: TradingMode,
    private readonly collateralAsset?: CollateralAsset
  ) {}

  async getHomePage(
    givenUser: Partial<UserDetails>
  ): Promise<ControllerResult> {
    const user = await this.userService.getUserDetails(givenUser)
    const paginationOpts = { offset: 0, limit: 6 }
    const [
      stateUpdates,
      totalStateUpdates,
      forcedUserTransactions,
      forcedUserTransactionsCount,
      forcedTradeOffers,
      forcedTradeOffersCount,
    ] = await Promise.all([
      this.preprocessedStateDetailsRepository.getPaginated(paginationOpts),
      this.preprocessedStateDetailsRepository.countAll(),
      this.userTransactionRepository.getPaginated({
        ...paginationOpts,
        types: FORCED_TRANSACTION_TYPES,
      }),
      this.userTransactionRepository.countAll(FORCED_TRANSACTION_TYPES),
      this.forcedTradeOfferRepository.getPaginated(paginationOpts),
      this.forcedTradeOfferRepository.countAll(),
    ])

    const assetDetailsMap = await getAssetHashToAssetDetailsMap(
      this.tradingMode,
      this.assetRepository,
      {
        userTransactions: forcedUserTransactions,
      }
    )

    const transactions = forcedUserTransactions.map((t) =>
      userTransactionToEntry(t, this.collateralAsset, assetDetailsMap)
    )

    const content = renderHomePage({
      user,
      tutorials: [], // explicitly no tutorials
      stateUpdates: stateUpdates.map((update) => ({
        timestamp: update.timestamp,
        id: update.stateUpdateId.toString(),
        hash: update.stateTransitionHash,
        updateCount: update.assetUpdateCount,
        forcedTransactionCount: update.forcedTransactionCount,
      })),
      totalStateUpdates,
      transactions,
      totalForcedTransactions: forcedUserTransactionsCount,
      offers: forcedTradeOffers.map(forcedTradeOfferToEntry),
      totalOffers: forcedTradeOffersCount,
      tradingMode: this.tradingMode,
    })
    return { type: 'success', content }
  }

  async getHomeStateUpdatesPage(
    givenUser: Partial<UserDetails>,
    pagination: PaginationOptions
  ): Promise<ControllerResult> {
    const user = await this.userService.getUserDetails(givenUser)

    const [total, stateUpdates] = await Promise.all([
      this.preprocessedStateDetailsRepository.countAll(),
      this.preprocessedStateDetailsRepository.getPaginated(pagination),
    ])

    const content = renderHomeStateUpdatesPage({
      user,
      stateUpdates: stateUpdates.map((update) => ({
        timestamp: update.timestamp,
        id: update.stateUpdateId.toString(),
        hash: update.stateTransitionHash,
        updateCount: update.assetUpdateCount,
        forcedTransactionCount: update.forcedTransactionCount,
      })),
      ...pagination,
      total,
    })
    return { type: 'success', content }
  }

  async getHomeForcedTransactionsPage(
    givenUser: Partial<UserDetails>,
    pagination: PaginationOptions
  ): Promise<ControllerResult> {
    const user = await this.userService.getUserDetails(givenUser)

    const [forcedUserTransactions, forcedUserTransactionsCount] =
      await Promise.all([
        this.userTransactionRepository.getPaginated({
          ...pagination,
          types: FORCED_TRANSACTION_TYPES,
        }),
        this.userTransactionRepository.countAll(FORCED_TRANSACTION_TYPES),
      ])

    const assetDetailsMap = await getAssetHashToAssetDetailsMap(
      this.tradingMode,
      this.assetRepository,
      {
        userTransactions: forcedUserTransactions,
      }
    )

    const transactions = forcedUserTransactions.map((t) =>
      userTransactionToEntry(t, this.collateralAsset, assetDetailsMap)
    )

    const content = renderHomeTransactionsPage({
      user,
      forcedTransactions: transactions,
      total: forcedUserTransactionsCount,
      ...pagination,
    })

    return { type: 'success', content }
  }
}
