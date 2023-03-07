import {
  renderStateUpdateBalanceChangesPage,
  renderStateUpdatePage,
  renderStateUpdateTransactionsPage,
} from '@explorer/frontend'
import { UserDetails } from '@explorer/shared'
import { AssetHash, AssetId } from '@explorer/types'

import { CollateralAsset } from '../../config/starkex/StarkexConfig'
import { UserService } from '../../core/UserService'
import { PaginationOptions } from '../../model/PaginationOptions'
import {
  PreprocessedAssetHistoryRecord,
  PreprocessedAssetHistoryRepository,
} from '../../peripherals/database/PreprocessedAssetHistoryRepository'
import { StateUpdateRepository } from '../../peripherals/database/StateUpdateRepository'
import { UserTransactionData } from '../../peripherals/database/transactions/UserTransaction'
import { UserTransactionRepository } from '../../peripherals/database/transactions/UserTransactionRepository'
import { ControllerResult } from './ControllerResult'
import { userTransactionToEntry } from './userTransactionToEntry'
import { getAssetPriceUSDCents } from './utils/toPositionAssetEntries'

const FORCED_TRANSACTION_TYPES: UserTransactionData['type'][] = [
  'ForcedWithdrawal',
  'ForcedTrade',
  'FullWithdrawal',
]

export class StateUpdateController {
  constructor(
    private readonly userService: UserService,
    private readonly stateUpdateRepository: StateUpdateRepository,
    private readonly userTransactionRepository: UserTransactionRepository,
    private readonly preprocessedAssetHistoryRepository: PreprocessedAssetHistoryRepository<
      AssetHash | AssetId
    >,
    private readonly tradingMode: 'perpetual' | 'spot',
    private readonly collateralAsset?: CollateralAsset
  ) {}

  async getStateUpdatePage(
    givenUser: Partial<UserDetails>,
    stateUpdateId: number
  ): Promise<ControllerResult> {
    const user = await this.userService.getUserDetails(givenUser)

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
      return { type: 'not found', content: 'State update not found' }
    }

    const balanceChangeEntries = toBalanceChangeEntries(balanceChanges)
    const priceEntries = prices.map((p) => ({
      asset: { hashOrId: p.assetId },
      price: getAssetPriceUSDCents(p.price, p.assetId),
      // TODO: Don't display, or correctly calculate this:
      change: 0n,
    }))

    const transactions = forcedUserTransactions.map((t) =>
      userTransactionToEntry(t, this.collateralAsset)
    )

    const content = renderStateUpdatePage({
      user,
      tradingMode: this.tradingMode,
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
    const user = await this.userService.getUserDetails(givenUser)

    const [balanceChanges, total] = await Promise.all([
      this.preprocessedAssetHistoryRepository.getByStateUpdateIdPaginated(
        stateUpdateId,
        pagination
      ),
      this.preprocessedAssetHistoryRepository.getCountByStateUpdateId(
        stateUpdateId
      ),
    ])

    const balanceChangeEntries = toBalanceChangeEntries(balanceChanges)

    const content = renderStateUpdateBalanceChangesPage({
      user,
      tradingMode: this.tradingMode,
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
    const user = await this.userService.getUserDetails(givenUser)

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

    const transactions = includedTransactions.map((t) =>
      userTransactionToEntry(t, this.collateralAsset)
    )

    const content = renderStateUpdateTransactionsPage({
      user,
      id: stateUpdateId.toString(),
      transactions: transactions,
      total: includedTransactionsCount,
      ...pagination,
    })

    return { type: 'success', content }
  }
}

function toBalanceChangeEntries(
  balanceChanges: PreprocessedAssetHistoryRecord<AssetHash | AssetId>[]
) {
  return balanceChanges.map((r) => ({
    starkKey: r.starkKey,
    asset: { hashOrId: r.assetHashOrId },
    balance: r.balance,
    change: r.balance - r.prevBalance,
    vaultOrPositionId: r.positionOrVaultId.toString(),
  }))
}
