import {
  renderNewPerpetualForcedActionPage,
  renderNewSpotForcedWithdrawPage,
} from '@explorer/frontend'
import { UserDetails, isPageContextUserDefined } from '@explorer/shared'
import { AssetHash, AssetId, EthereumAddress } from '@explorer/types'

import { PageContextService } from '../../core/PageContextService'
import { AssetRepository } from '../../peripherals/database/AssetRepository'
import { PreprocessedAssetHistoryRepository } from '../../peripherals/database/PreprocessedAssetHistoryRepository'
import { ControllerResult } from './ControllerResult'

export class ForcedActionController {
  constructor(
    private readonly pageContextService: PageContextService,
    private readonly preprocessedAssetHistoryRepository: PreprocessedAssetHistoryRepository<
      AssetHash | AssetId
    >,
    private readonly assetRepository: AssetRepository,
    private readonly starkExAddress: EthereumAddress
  ) {}

  async getSpotForcedWithdrawalPage(
    givenUser: Partial<UserDetails>,
    vaultId: bigint
  ): Promise<ControllerResult> {
    const context = await this.pageContextService.getPageContext(givenUser)

    if (!isPageContextUserDefined(context)) {
      return { type: 'not found', content: 'User not found' }
    }

    const assets =
      await this.preprocessedAssetHistoryRepository.getCurrentByPositionOrVaultId(
        vaultId
      )

    const asset = assets[0]
    if (!asset) {
      return { type: 'not found', content: 'Vault is empty' }
    }

    if (asset.starkKey != context.user.starkKey) {
      return { type: 'not found', content: 'Vault does not belong to user' }
    }

    const assetDetails = await this.assetRepository.findDetailsByAssetHash(
      asset.assetHashOrId as AssetHash
    )

    const content = renderNewSpotForcedWithdrawPage({
      context,
      user: context.user,
      starkExAddress: this.starkExAddress,
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

  async getPerpetualForcedWithdrawalPage(
    givenUser: Partial<UserDetails>,
    positionId: bigint,
    assetId: AssetId
  ): Promise<ControllerResult> {
    const context = await this.pageContextService.getPageContext(givenUser)

    if (!isPageContextUserDefined(context)) {
      return { type: 'not found', content: 'User not found' }
    }

    const assets =
      await this.preprocessedAssetHistoryRepository.getCurrentByPositionOrVaultId(
        positionId
      )

    const asset = assets.find((asset) => asset.assetHashOrId === assetId)
    if (!asset) {
      return {
        type: 'not found',
        content:
          'Position is empty or does not contain asset with given assetId',
      }
    }

    if (asset.starkKey != context.user.starkKey) {
      return { type: 'not found', content: 'Position does not belong to user' }
    }

    const content = renderNewSpotForcedWithdrawPage({
      context,
      user: context.user,
      starkExAddress: this.starkExAddress,
      positionOrVaultId: positionId,
      starkKey: asset.starkKey,
      asset: {
        hashOrId: asset.assetHashOrId,
        balance: asset.balance,
        priceUSDCents: 0n,
      },
    })

    return { type: 'success', content }
  }

  async getPerpetualForcedTradePage(
    givenUser: Partial<UserDetails>,
    positionId: bigint,
    assetId: AssetId
  ): Promise<ControllerResult> {
    const context = await this.pageContextService.getPageContext(givenUser)

    if (!isPageContextUserDefined(context)) {
      return { type: 'not found', content: 'User not found' }
    }

    const assets =
      await this.preprocessedAssetHistoryRepository.getCurrentByPositionOrVaultId(
        positionId
      )

    const asset = assets.find((asset) => asset.assetHashOrId === assetId)
    if (!asset) {
      return { type: 'not found', content: 'Position is empty' }
    }

    if (asset.starkKey != context.user.starkKey) {
      return { type: 'not found', content: 'Position does not belong to user' }
    }

    const content = renderNewPerpetualForcedActionPage({
      context,
      user: context.user,
      starkExAddress: this.starkExAddress,
      positionOrVaultId: positionId,
      starkKey: asset.starkKey,
      asset: {
        hashOrId: asset.assetHashOrId,
        balance: asset.balance,
        priceUSDCents: 0n,
      },
    })
    return { type: 'success', content }
  }
}
