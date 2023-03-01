import { renderNewSpotForcedWithdrawPage } from '@explorer/frontend'
import { UserDetails } from '@explorer/shared'
import { AssetHash, AssetId, EthereumAddress } from '@explorer/types'

import { UserService } from '../../core/UserService'
import { AssetRepository } from '../../peripherals/database/AssetRepository'
import { PreprocessedAssetHistoryRepository } from '../../peripherals/database/PreprocessedAssetHistoryRepository'
import { ControllerResult } from './ControllerResult'

export class SpotForcedWithdrawalController {
  constructor(
    private readonly userService: UserService,
    private readonly preprocessedAssetHistoryRepository: PreprocessedAssetHistoryRepository<
      AssetHash | AssetId
    >,
    private readonly assetRepository: AssetRepository
  ) {}

  async getSpotForcedWithdrawalPage(
    givenUser: Partial<UserDetails>,
    vaultId: bigint
  ): Promise<ControllerResult> {
    const user = await this.userService.getUserDetails(givenUser)

    if (!user) {
      return { type: 'not found', content: 'User must be logged in' }
    }

    const assets =
      await this.preprocessedAssetHistoryRepository.getCurrentByPositionOrVaultId(
        vaultId
      )

    const asset = assets[0]
    if (!asset) {
      return { type: 'not found', content: 'Vault is empty' }
    }

    const assetDetails = await this.assetRepository.findDetailsByAssetHash(
      asset.assetHashOrId as AssetHash
    )

    const content = renderNewSpotForcedWithdrawPage({
      user,
      starkExAddress: EthereumAddress.ZERO,
      positionOrVaultId: vaultId,
      starkKey: asset.starkKey,
      asset: {
        hashOrId: asset.assetHashOrId,
        balance: asset.balance,
        details: assetDetails,
        priceUSDCents: 0n,
      },
    })

    return { type: 'success', content }
  }
}
