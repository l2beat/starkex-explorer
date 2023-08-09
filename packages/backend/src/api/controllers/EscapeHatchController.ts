import { encodeStateAsInt256Array } from '@explorer/encoding/build/encoding/encodeState'
import {
  renderEscapeHatchActionPage,
  renderFreezeRequestActionPage,
} from '@explorer/frontend'
import {
  assertUnreachable,
  PageContextWithUser,
  UserDetails,
} from '@explorer/shared'
import { EthereumAddress } from '@explorer/types'

import { FreezeCheckService } from '../../core/FreezeCheckService'
import { PageContextService } from '../../core/PageContextService'
import { StateUpdater } from '../../core/StateUpdater'
import { StateUpdateRepository } from '../../peripherals/database/StateUpdateRepository'
import { UserTransactionRecord } from '../../peripherals/database/transactions/UserTransactionRepository'
import { ControllerResult } from './ControllerResult'
import { serializeMerkleProofForEscape } from './serializeMerkleProofForEscape'

export class EscapeHatchController {
  constructor(
    private readonly pageContextService: PageContextService,
    private readonly freezeCheckService: FreezeCheckService,
    private readonly stateUpdater: StateUpdater,
    private readonly stateUpdateRepository: StateUpdateRepository,
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
      throw new Error(
        'Exchange is freezable but all forced actions are included!'
      )
    }

    const content = this.getFreezeRequestActionPageContent(
      context,
      oldestNotIncludedForcedAction
    )

    return { type: 'success', content }
  }

  private getFreezeRequestActionPageContent(
    context: PageContextWithUser,
    transaction: UserTransactionRecord<
      'ForcedTrade' | 'ForcedWithdrawal' | 'FullWithdrawal'
    >
  ) {
    const base = {
      context,
      transactionHash: transaction.transactionHash,
      starkExAddress: this.starkExAddress,
    }
    const data = transaction.data

    switch (data.type) {
      case 'ForcedWithdrawal': {
        return renderFreezeRequestActionPage({
          ...base,
          type: data.type,
          starkKey: data.starkKey,
          positionId: data.positionId,
          quantizedAmount: data.quantizedAmount,
        })
      }
      case 'ForcedTrade': {
        if (context.tradingMode !== 'perpetual') {
          throw new Error('Forced trade is only supported in perpetual mode')
        }
        return renderFreezeRequestActionPage({
          ...base,
          collateralAsset: context.collateralAsset,
          type: data.type,
          starkKeyA: data.starkKeyA,
          starkKeyB: data.starkKeyB,
          positionIdA: data.positionIdA,
          positionIdB: data.positionIdB,
          collateralAssetId: data.collateralAssetId,
          syntheticAssetId: data.syntheticAssetId,
          collateralAmount: data.collateralAmount,
          syntheticAmount: data.syntheticAmount,
          isABuyingSynthetic: data.isABuyingSynthetic,
          nonce: data.nonce,
        })
      }
      case 'FullWithdrawal':
        return renderFreezeRequestActionPage({
          ...base,
          type: data.type,
          starkKey: data.starkKey,
          vaultId: data.vaultId,
        })
      default:
        assertUnreachable(data)
    }
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

    const merkleProof = await this.stateUpdater.generateMerkleProof(
      positionOrVaultId
    )
    const serializedMerkleProof = serializeMerkleProofForEscape(merkleProof)

    const latestStateUpdate = await this.stateUpdateRepository.findLast()
    if (!latestStateUpdate) {
      throw new Error('No state update found to perform escape')
    }
    if (!latestStateUpdate.perpetualState) {
      throw new Error('No perpetual state recorded to perform escape')
    }
    const serializedState = encodeStateAsInt256Array(
      latestStateUpdate.perpetualState
    )

    const content = renderEscapeHatchActionPage({
      context,
      starkKey: merkleProof.starkKey,
      escapeVerifierAddress: this.escapeVerifierAddress,
      positionOrVaultId,
      serializedMerkleProof,
      assetCount: merkleProof.perpetualAssetCount,
      serializedState,
    })

    return { type: 'success', content }
  }
}
