import { renderNewSpotForcedWithdrawPage } from '@explorer/frontend'
import { UserDetails } from '@explorer/shared'
import { AssetHash, EthereumAddress } from '@explorer/types'

import { PageContextService } from '../../core/PageContextService'
import { AssetRepository } from '../../peripherals/database/AssetRepository'
import { PreprocessedAssetHistoryRepository } from '../../peripherals/database/PreprocessedAssetHistoryRepository'
import { ControllerResult } from './ControllerResult'

export class SpotForcedWithdrawalController {
  constructor(
    private readonly pageContextService: PageContextService,
    private readonly preprocessedAssetHistoryRepository: PreprocessedAssetHistoryRepository,
    private readonly assetRepository: AssetRepository
  ) {}

  async getSpotForcedWithdrawalPage(
    givenUser: Partial<UserDetails>,
    vaultId: bigint
  ): Promise<ControllerResult> {
    const context = await this.pageContextService.getPageContextWithUser(
      givenUser
    )

    if (!context) {
      return { type: 'not found', content: 'User must be logged in' }
    }

    if (context.tradingMode !== 'spot') {
      return { type: 'not found', content: 'Page not found' }
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
      context,
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
