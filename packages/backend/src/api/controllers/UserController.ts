import { renderUserPage, UserAssetEntry } from '@explorer/frontend'
import { UserBalanceChangeEntry } from '@explorer/frontend/src/view/pages/user/components/UserBalanceChangesTable'
import { UserDetails } from '@explorer/shared'
import { AssetHash, AssetId, EthereumAddress, StarkKey } from '@explorer/types'

import { CollateralAsset } from '../../config/starkex/StarkexConfig'
import { UserService } from '../../core/UserService'
import { PreprocessedAssetHistoryRepository } from '../../peripherals/database/PreprocessedAssetHistoryRepository'
import { ControllerResult } from './ControllerResult'

export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly preprocessedAssetHistoryRepository: PreprocessedAssetHistoryRepository<
      AssetHash | AssetId
    >,
    private readonly collateralAsset?: CollateralAsset
  ) {}

  async getUserPage(
    givenUser: Partial<UserDetails>,
    starkKey: StarkKey
  ): Promise<ControllerResult> {
    const user = await this.userService.getUserDetails(givenUser)

    const assets = (
      await this.preprocessedAssetHistoryRepository.getCurrentByStarkKey(
        starkKey
      )
    ).map(
      (r): UserAssetEntry => ({
        asset: { hashOrId: r.assetHashOrId },
        balance: r.balance,
        value: r.price !== undefined ? r.price * r.balance : 0n,
        vaultOrPositionId: r.positionOrVaultId.toString(),
        action:
          r.assetHashOrId === this.collateralAsset?.assetId
            ? 'WITHDRAW'
            : 'CLOSE',
      })
    )

    const balanceChanges = (
      await this.preprocessedAssetHistoryRepository.getByStarkKey(starkKey)
    ).map(
      (r): UserBalanceChangeEntry => ({
        timestamp: r.timestamp,
        stateUpdateId: r.stateUpdateId.toString(),
        asset: { hashOrId: r.assetHashOrId },
        balance: r.balance,
        change: r.balance - r.prevBalance,
        vaultOrPositionId: r.positionOrVaultId.toString(),
      })
    )

    const content = renderUserPage({
      user,
      type: 'PERPETUAL',
      starkKey,
      ethereumAddress: EthereumAddress.ZERO,
      withdrawableAssets: [],
      offersToAccept: [],
      assets,
      totalAssets: 0,
      balanceChanges,
      totalBalanceChanges: 0,
      transactions: [],
      totalTransactions: 0,
      offers: [],
      totalOffers: 0,
    })

    return { type: 'success', content }
  }
}
