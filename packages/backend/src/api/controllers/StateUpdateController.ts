import {
  renderStateUpdateBalanceChangesPage,
  renderStateUpdateL2TransactionsPage,
  renderStateUpdatePage,
  renderStateUpdateTransactionsPage,
} from '@explorer/frontend'
import { UserDetails } from '@explorer/shared'
import { AssetHash } from '@explorer/types'

import { L2TransactionTypesToExclude } from '../../config/starkex/StarkexConfig'
import { AssetDetailsMap } from '../../core/AssetDetailsMap'
import { AssetDetailsService } from '../../core/AssetDetailsService'
import { PageContextService } from '../../core/PageContextService'
import { PaginationOptions } from '../../model/PaginationOptions'
import { L2TransactionRepository } from '../../peripherals/database/L2TransactionRepository'
import {
  PreprocessedAssetHistoryRecord,
  PreprocessedAssetHistoryRepository,
} from '../../peripherals/database/PreprocessedAssetHistoryRepository'
import { sumUpTransactionCount } from '../../peripherals/database/PreprocessedL2TransactionsStatistics'
import { PreprocessedStateDetailsRepository } from '../../peripherals/database/PreprocessedStateDetailsRepository'
import { StateUpdateRepository } from '../../peripherals/database/StateUpdateRepository'
import { UserTransactionData } from '../../peripherals/database/transactions/UserTransaction'
import { UserTransactionRepository } from '../../peripherals/database/transactions/UserTransactionRepository'
import { getAssetPriceUSDCents } from '../../utils/assets'
import { ControllerResult } from './ControllerResult'
import { l2TransactionToEntry } from './l2TransactionToEntry'
import { userTransactionToEntry } from './userTransactionToEntry'

const FORCED_TRANSACTION_TYPES: UserTransactionData['type'][] = [
  'ForcedWithdrawal',
  'ForcedTrade',
  'FullWithdrawal',
]

export class StateUpdateController {
  constructor(
    private readonly pageContextService: PageContextService,
    private readonly assetDetailsService: AssetDetailsService,
    private readonly stateUpdateRepository: StateUpdateRepository,
    private readonly userTransactionRepository: UserTransactionRepository,
    private readonly l2TransactionRepository: L2TransactionRepository,
    private readonly preprocessedAssetHistoryRepository: PreprocessedAssetHistoryRepository,
    private readonly preprocessedStateDetailsRepository: PreprocessedStateDetailsRepository,
    private readonly excludeL2TransactionTypes:
      | L2TransactionTypesToExclude
      | undefined
  ) {}

  async getStateUpdatePage(
    givenUser: Partial<UserDetails>,
    stateUpdateId: number
  ): Promise<ControllerResult> {
    const context = await this.pageContextService.getPageContext(givenUser)
    const collateralAsset = this.pageContextService.getCollateralAsset(context)

    const [
      stateUpdate,
      balanceChanges,
      totalBalanceChanges,
      prices,
      forcedUserTransactions,
      totalForcedUserTransactions,
      l2Transactions,
      preprocessedStateDetails,
    ] = await Promise.all([
      this.stateUpdateRepository.findById(stateUpdateId),
      this.preprocessedAssetHistoryRepository.getByStateUpdateIdPaginated(
        stateUpdateId,
        { offset: 0, limit: 10 }
      ),
      this.preprocessedAssetHistoryRepository.getCountByStateUpdateId(
        stateUpdateId
      ),
      this.stateUpdateRepository.getPricesByStateUpdateId(stateUpdateId),
      this.userTransactionRepository.getByStateUpdateId(
        stateUpdateId,
        FORCED_TRANSACTION_TYPES,
        { offset: 0, limit: 6 }
      ),
      this.userTransactionRepository.getCountOfIncludedByStateUpdateId(
        stateUpdateId
      ),
      this.l2TransactionRepository.getPaginatedWithoutMultiByStateUpdateId(
        stateUpdateId,
        {
          offset: 0,
          limit: 6,
        },
        this.excludeL2TransactionTypes
      ),
      this.preprocessedStateDetailsRepository.findByStateUpdateId(
        stateUpdateId
      ),
    ])

    if (!stateUpdate) {
      return {
        type: 'not found',
        message: `State update #${stateUpdateId} not found`,
      }
    }

    const balanceChangeEntries = toBalanceChangeEntries(balanceChanges)
    const priceEntries = prices.map((p) => ({
      asset: { hashOrId: p.assetId },
      priceInCents: getAssetPriceUSDCents(p.price, p.assetId),
    }))

    const assetDetailsMap = await this.assetDetailsService.getAssetDetailsMap({
      assetHistory: balanceChanges,
      userTransactions: forcedUserTransactions,
    })

    const transactions = forcedUserTransactions.map((t) =>
      userTransactionToEntry(t, collateralAsset, assetDetailsMap)
    )

    const content = renderStateUpdatePage({
      context,
      id: stateUpdateId.toString(),
      hashes: {
        factHash: stateUpdate.stateTransitionHash,
        positionTreeRoot: stateUpdate.rootHash,
        // TODO - extract this data:
        onChainVaultTreeRoot: undefined,
        offChainVaultTreeRoot: undefined,
        orderRoot: undefined,
      },
      blockNumber: stateUpdate.blockNumber,
      ethereumTimestamp: stateUpdate.timestamp,
      // TODO - what is this?
      starkExTimestamp: stateUpdate.timestamp,
      balanceChanges: balanceChangeEntries,
      totalBalanceChanges,
      priceChanges: priceEntries,
      l2Transactions: l2Transactions.map(l2TransactionToEntry),
      totalL2Transactions: preprocessedStateDetails?.l2TransactionsStatistics
        ? sumUpTransactionCount(
            preprocessedStateDetails.l2TransactionsStatistics,
            this.excludeL2TransactionTypes
          )
        : 'processing',
      transactions,
      totalTransactions: totalForcedUserTransactions,
    })

    return { type: 'success', content }
  }

  async getStateUpdateL2TransactionsPage(
    givenUser: Partial<UserDetails>,
    stateUpdateId: number,
    pagination: PaginationOptions
  ): Promise<ControllerResult> {
    const context = await this.pageContextService.getPageContext(givenUser)

    const [l2Transactions, preprocessedStateDetails] = await Promise.all([
      this.l2TransactionRepository.getPaginatedWithoutMultiByStateUpdateId(
        stateUpdateId,
        pagination,
        this.excludeL2TransactionTypes
      ),
      this.preprocessedStateDetailsRepository.findByStateUpdateId(
        stateUpdateId
      ),
    ])

    const content = renderStateUpdateL2TransactionsPage({
      context,
      id: stateUpdateId.toString(),
      l2Transactions: l2Transactions.map(l2TransactionToEntry),
      ...pagination,
      total: preprocessedStateDetails?.l2TransactionsStatistics
        ? sumUpTransactionCount(
            preprocessedStateDetails.l2TransactionsStatistics,
            this.excludeL2TransactionTypes
          )
        : 'processing',
    })

    return { type: 'success', content }
  }

  async getStateUpdateBalanceChangesPage(
    givenUser: Partial<UserDetails>,
    stateUpdateId: number,
    pagination: PaginationOptions
  ): Promise<ControllerResult> {
    const context = await this.pageContextService.getPageContext(givenUser)

    const [balanceChanges, total] = await Promise.all([
      this.preprocessedAssetHistoryRepository.getByStateUpdateIdPaginated(
        stateUpdateId,
        pagination
      ),
      this.preprocessedAssetHistoryRepository.getCountByStateUpdateId(
        stateUpdateId
      ),
    ])

    const assetDetailsMap = await this.assetDetailsService.getAssetDetailsMap({
      assetHistory: balanceChanges,
    })

    const balanceChangeEntries = toBalanceChangeEntries(
      balanceChanges,
      assetDetailsMap
    )

    const content = renderStateUpdateBalanceChangesPage({
      context,
      id: stateUpdateId.toString(),
      balanceChanges: balanceChangeEntries,
      ...pagination,
      total,
    })

    return { type: 'success', content }
  }

  async getStateUpdateIncludedTransactionsPage(
    givenUser: Partial<UserDetails>,
    stateUpdateId: number,
    pagination: PaginationOptions
  ): Promise<ControllerResult> {
    const context = await this.pageContextService.getPageContext(givenUser)
    const collateralAsset = this.pageContextService.getCollateralAsset(context)

    const [includedTransactions, includedTransactionsCount] = await Promise.all(
      [
        this.userTransactionRepository.getByStateUpdateId(
          stateUpdateId,
          FORCED_TRANSACTION_TYPES,
          pagination
        ),
        this.userTransactionRepository.getCountOfIncludedByStateUpdateId(
          stateUpdateId
        ),
      ]
    )

    const assetDetailsMap = await this.assetDetailsService.getAssetDetailsMap({
      userTransactions: includedTransactions,
    })

    const transactions = includedTransactions.map((t) =>
      userTransactionToEntry(t, collateralAsset, assetDetailsMap)
    )

    const content = renderStateUpdateTransactionsPage({
      context,
      id: stateUpdateId.toString(),
      transactions: transactions,
      total: includedTransactionsCount,
      ...pagination,
    })

    return { type: 'success', content }
  }
}

function toBalanceChangeEntries(
  balanceChanges: PreprocessedAssetHistoryRecord[],
  assetDetailsMap?: AssetDetailsMap
) {
  return balanceChanges.map((r) => ({
    starkKey: r.starkKey,
    asset: {
      hashOrId: r.assetHashOrId,
      assetDetails: AssetHash.check(r.assetHashOrId)
        ? assetDetailsMap?.getByAssetHash(r.assetHashOrId)
        : undefined,
    },
    balance: r.balance,
    change: r.balance - r.prevBalance,
    vaultOrPositionId: r.positionOrVaultId.toString(),
  }))
}
