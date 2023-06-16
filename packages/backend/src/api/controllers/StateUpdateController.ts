import {
  renderStateUpdateBalanceChangesPage,
  renderStateUpdatePage,
  renderStateUpdateTransactionsPage,
} from '@explorer/frontend'
import { UserDetails } from '@explorer/shared'
import { AssetHash } from '@explorer/types'

import { AssetDetailsMap } from '../../core/AssetDetailsMap'
import { AssetDetailsService } from '../../core/AssetDetailsService'
import { PageContextService } from '../../core/PageContextService'
import { PaginationOptions } from '../../model/PaginationOptions'
import {
  PreprocessedAssetHistoryRecord,
  PreprocessedAssetHistoryRepository,
} from '../../peripherals/database/PreprocessedAssetHistoryRepository'
import { StateUpdateRepository } from '../../peripherals/database/StateUpdateRepository'
import { UserTransactionData } from '../../peripherals/database/transactions/UserTransaction'
import { UserTransactionRepository } from '../../peripherals/database/transactions/UserTransactionRepository'
import { getAssetPriceUSDCents } from '../../utils/assets'
import { ControllerResult } from './ControllerResult'
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
    private readonly preprocessedAssetHistoryRepository: PreprocessedAssetHistoryRepository
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
      forcedUserTransactionsCount,
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
    ])

    if (!stateUpdate) {
      return { type: 'not found', message: 'State update not found' }
    }

    const balanceChangeEntries = toBalanceChangeEntries(balanceChanges)
    const priceEntries = prices.map((p) => ({
      asset: { hashOrId: p.assetId },
      price: getAssetPriceUSDCents(p.price, p.assetId),
      // TODO: Don't display, or correctly calculate this:
      change: 0n,
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
      transactions,
      totalTransactions: forcedUserTransactionsCount,
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
