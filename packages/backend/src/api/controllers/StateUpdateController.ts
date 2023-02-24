import {
  renderStateUpdateBalanceChangesPage,
  renderStateUpdatePage,
} from '@explorer/frontend'
import { UserDetails } from '@explorer/shared'
import { AssetHash, AssetId } from '@explorer/types'

import { UserService } from '../../core/UserService'
import { PaginationOptions } from '../../model/PaginationOptions'
import {
  PreprocessedAssetHistoryRecord,
  PreprocessedAssetHistoryRepository,
} from '../../peripherals/database/PreprocessedAssetHistoryRepository'
import { StateUpdateRepository } from '../../peripherals/database/StateUpdateRepository'
import { ControllerResult } from './ControllerResult'

export class StateUpdateController {
  constructor(
    private readonly userService: UserService,
    private readonly stateUpdateRepository: StateUpdateRepository,
    private readonly preprocessedAssetHistoryRepository: PreprocessedAssetHistoryRepository<
      AssetHash | AssetId
    >,
    private readonly tradingMode: 'perpetual' | 'spot'
  ) {}

  async getStateUpdatePage(
    givenUser: Partial<UserDetails>,
    stateUpdateId: number
  ): Promise<ControllerResult> {
    const user = await this.userService.getUserDetails(givenUser)

    const [stateUpdate, balanceChanges, totalBalanceChanges, prices] =
      await Promise.all([
        this.stateUpdateRepository.findById(stateUpdateId),
        this.preprocessedAssetHistoryRepository.getByStateUpdateIdPaginated(
          stateUpdateId,
          { offset: 0, limit: 10 }
        ),
        this.preprocessedAssetHistoryRepository.getCountByStateUpdateId(
          stateUpdateId
        ),
        this.stateUpdateRepository.getPricesByStateUpdateId(stateUpdateId),
      ])

    if (!stateUpdate) {
      return { type: 'not found', content: 'State update not found' }
    }

    const balanceChangeEntries = toBalanceChangeEntries(balanceChanges)
    const priceEntries = prices.map((p) => ({
      asset: { hashOrId: p.assetId },
      price: p.price,
      change: 0n,
    }))

    const content = renderStateUpdatePage({
      user,
      type: this.tradingMode === 'perpetual' ? 'PERPETUAL' : 'SPOT',
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
      transactions: [],
      totalTransactions: 0,
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
      type: this.tradingMode === 'perpetual' ? 'PERPETUAL' : 'SPOT',
      id: '1534',
      balanceChanges: balanceChangeEntries,
      ...pagination,
      total,
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
