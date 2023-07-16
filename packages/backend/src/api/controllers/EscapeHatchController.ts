import {
  renderEscapeHatchActionPage,
  renderFreezeRequestActionPage,
} from '@explorer/frontend'
import { UserDetails } from '@explorer/shared'
import { EthereumAddress } from '@explorer/types'

import { FreezeCheckService } from '../../core/FreezeCheckService'
import { PageContextService } from '../../core/PageContextService'
import { ControllerResult } from './ControllerResult'

export class EscapeHatchController {
  constructor(
    private readonly pageContextService: PageContextService,
    private readonly freezeCheckService: FreezeCheckService,
    private readonly starkExAddress: EthereumAddress,
    private readonly escapeVerifierAddress: EthereumAddress
  ) {}

  async getFreezeRequestActionPage(
    givenUser: Partial<UserDetails>
  ): Promise<ControllerResult> {
    const context = await this.pageContextService.getPageContextWithUser(
      givenUser
    )

    if (!context) {
      return {
        type: 'not found',
        message: 'You have to connect your wallet to access this page',
      }
    }

    if (context.freezeStatus !== 'freezable') {
      return {
        type: 'not found',
        message: 'Exchange is not freezable',
      }
    }

    const oldestNotIncludedForcedAction =
      await this.freezeCheckService.findOldestNotIncludedForcedAction()
    if (!oldestNotIncludedForcedAction) {
      return {
        type: 'not found',
        message: 'Freeze is no longer possible',
      }
    }

    if (oldestNotIncludedForcedAction.data.type !== 'ForcedWithdrawal') {
      return {
        type: 'not found',
        message: 'Functionality not yet supported',
      }
    }

    const data = oldestNotIncludedForcedAction.data
    const content = renderFreezeRequestActionPage({
      context,
      transactionHash: oldestNotIncludedForcedAction.transactionHash,
      starkKey: data.starkKey,
      positionOrVaultId: data.positionId,
      quantizedAmount: data.quantizedAmount,
      starkExAddress: this.starkExAddress,
    })

    return { type: 'success', content }
  }

  async getEscapeHatchActionPage(
    givenUser: Partial<UserDetails>,
    positionOrVaultId: bigint
  ): Promise<ControllerResult> {
    const context = await this.pageContextService.getPageContextWithUser(
      givenUser
    )

    if (!context) {
      return {
        type: 'not found',
        message: 'You have to connect your wallet to access this page',
      }
    }

    if (context.freezeStatus !== 'frozen') {
      return {
        type: 'not found',
        message: 'Exchange is not frozen',
      }
    }

    const content = renderEscapeHatchActionPage({
      context,
      escapeVerifierAddress: this.escapeVerifierAddress,
      positionOrVaultId,
    })

    return { type: 'success', content }
  }
}
