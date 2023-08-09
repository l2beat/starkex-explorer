import {
  renderFinalizeEscapeDetailsPage,
  renderFreezeRequestDetailsPage,
  renderInitializeEscapePage,
  renderOfferAndForcedTradePage,
  renderPerpetualForcedWithdrawalPage,
  renderRegularWithdrawalPage,
  renderSpotForcedWithdrawalPage,
} from '@explorer/frontend'
import { assertUnreachable, PageContext, UserDetails } from '@explorer/shared'
import { Hash256 } from '@explorer/types'

import { PageContextService } from '../../core/PageContextService'
import { TransactionHistory } from '../../core/TransactionHistory'
import { AssetRepository } from '../../peripherals/database/AssetRepository'
import {
  ForcedTradeOfferRecord,
  ForcedTradeOfferRepository,
} from '../../peripherals/database/ForcedTradeOfferRepository'
import {
  SentTransactionRecord,
  SentTransactionRepository,
} from '../../peripherals/database/transactions/SentTransactionRepository'
import {
  UserTransactionRecord,
  UserTransactionRepository,
} from '../../peripherals/database/transactions/UserTransactionRepository'
import { UserRegistrationEventRepository } from '../../peripherals/database/UserRegistrationEventRepository'
import { ControllerResult } from './ControllerResult'

export class TransactionController {
  constructor(
    private readonly pageContextService: PageContextService,
    private readonly sentTransactionRepository: SentTransactionRepository,
    private readonly forcedTradeOfferRepository: ForcedTradeOfferRepository,
    private readonly userTransactionRepository: UserTransactionRepository,
    private readonly userRegistrationEventRepository: UserRegistrationEventRepository,
    private readonly assetRepository: AssetRepository
  ) {}

  async getTransactionPage(
    givenUser: Partial<UserDetails>,
    txHash: Hash256
  ): Promise<ControllerResult> {
    const context = await this.pageContextService.getPageContext(givenUser)

    const [sentTransaction, forcedTradeOffer, userTransaction] =
      await Promise.all([
        this.sentTransactionRepository.findByTransactionHash(txHash),
        this.forcedTradeOfferRepository.findByTransactionHash(txHash),
        this.userTransactionRepository.findByTransactionHash(txHash),
      ])

    if (sentTransaction && !userTransaction) {
      return await this.getTransactionPageForSentTransaction(
        context,
        sentTransaction,
        forcedTradeOffer
      )
    }

    if (userTransaction) {
      return await this.getTransactionPageForUserTransaction(
        context,
        userTransaction,
        sentTransaction,
        forcedTradeOffer
      )
    }

    return {
      type: 'not found',
      message: `Transaction ${txHash.toString()} not found`,
    }
  }

  async getTransactionPageForUserTransaction(
    context: PageContext,
    userTransaction: UserTransactionRecord,
    sentTransaction: SentTransactionRecord | undefined,
    forcedTradeOffer: ForcedTradeOfferRecord | undefined
  ): Promise<ControllerResult> {
    switch (userTransaction.data.type) {
      case 'ForcedWithdrawal': {
        if (context.tradingMode !== 'perpetual') {
          return { type: 'not found' }
        }
        const txUser =
          await this.userRegistrationEventRepository.findByStarkKey(
            userTransaction.data.starkKey
          )
        const transactionHistory = new TransactionHistory({
          sentTransaction,
          userTransaction,
        })

        const content = renderPerpetualForcedWithdrawalPage({
          context,
          transactionHash: userTransaction.transactionHash,
          recipient: {
            starkKey: userTransaction.data.starkKey,
            ethereumAddress: txUser?.ethAddress,
          },
          asset: { hashOrId: context.collateralAsset.assetId },
          amount: userTransaction.data.quantizedAmount,
          positionId: userTransaction.data.positionId.toString(),
          history: transactionHistory.getForcedTransactionHistory(),
          stateUpdateId: userTransaction.included?.stateUpdateId,
        })
        return { type: 'success', content }
      }
      case 'FullWithdrawal': {
        if (context.tradingMode !== 'spot') {
          return { type: 'not found' }
        }

        const txUser =
          await this.userRegistrationEventRepository.findByStarkKey(
            userTransaction.data.starkKey
          )
        const transactionHistory = new TransactionHistory({
          sentTransaction,
          userTransaction,
        })
        const content = renderSpotForcedWithdrawalPage({
          context,
          transactionHash: userTransaction.transactionHash,
          recipient: {
            starkKey: userTransaction.data.starkKey,
            ethereumAddress: txUser?.ethAddress,
          },
          vaultId: userTransaction.data.vaultId.toString(),
          history: transactionHistory.getForcedTransactionHistory(),
          stateUpdateId: userTransaction.included?.stateUpdateId,
        })
        return { type: 'success', content }
      }
      case 'ForcedTrade': {
        if (context.tradingMode !== 'perpetual') {
          return { type: 'not found' }
        }
        const [userA, userB] = await Promise.all([
          this.userRegistrationEventRepository.findByStarkKey(
            userTransaction.data.starkKeyA
          ),
          this.userRegistrationEventRepository.findByStarkKey(
            userTransaction.data.starkKeyB
          ),
        ])
        if (!userA) {
          return { type: 'not found', message: 'User A not found' }
        }
        const maker = {
          starkKey: userA.starkKey,
          ethereumAddress: userA.ethAddress,
          positionId: userTransaction.data.positionIdA.toString(),
        }
        const taker = userB
          ? {
              starkKey: userB.starkKey,
              ethereumAddress: userB.ethAddress,
              positionId: userTransaction.data.positionIdB.toString(),
            }
          : undefined

        const transactionHistory = new TransactionHistory({
          forcedTradeOffer,
          sentTransaction,
          userTransaction,
        })
        const content = renderOfferAndForcedTradePage({
          context,
          transactionHash: userTransaction.transactionHash,
          offerId: forcedTradeOffer?.id.toString(),
          maker,
          taker,
          type: userTransaction.data.isABuyingSynthetic ? 'BUY' : 'SELL',
          collateralAmount: userTransaction.data.collateralAmount,
          syntheticAsset: { hashOrId: userTransaction.data.syntheticAssetId },
          syntheticAmount: userTransaction.data.syntheticAmount,
          expirationTimestamp: forcedTradeOffer?.accepted
            ? forcedTradeOffer.accepted.submissionExpirationTime
            : undefined,
          history: transactionHistory.getForcedTradeTransactionHistory(),
          stateUpdateId: userTransaction.included?.stateUpdateId,
        })
        return { type: 'success', content }
      }

      case 'Withdraw':
      case 'WithdrawWithTokenId':
      case 'MintWithdraw': {
        const transactionHistory = new TransactionHistory({
          sentTransaction,
          userTransaction,
        })
        const data = userTransaction.data
        const assetHash =
          data.type === 'Withdraw'
            ? context.tradingMode === 'perpetual'
              ? context.collateralAsset.assetId
              : data.assetType
            : data.assetId

        let recipientEthAddress =
          data.type === 'Withdraw' || data.type === 'WithdrawWithTokenId'
            ? data.recipient
            : undefined

        if (!recipientEthAddress) {
          const recipient =
            await this.userRegistrationEventRepository.findByStarkKey(
              userTransaction.data.starkKey
            )
          recipientEthAddress = recipient?.ethAddress
        }
        const content = renderRegularWithdrawalPage({
          context,
          transactionHash: userTransaction.transactionHash,
          recipient: {
            starkKey: userTransaction.data.starkKey,
            ethereumAddress: recipientEthAddress,
          },
          asset: { hashOrId: assetHash },
          amount: userTransaction.data.quantizedAmount,
          history: transactionHistory.getRegularTransactionHistory(),
          stateUpdateId: userTransaction.included?.stateUpdateId,
        })
        return { type: 'success', content }
      }

      case 'VerifyEscape': {
        //TODO: Check if we need different for Spot and Perpetual
        if (context.tradingMode !== 'perpetual') {
          return { type: 'not found' }
        }
        const txUser =
          await this.userRegistrationEventRepository.findByStarkKey(
            userTransaction.data.starkKey
          )
        const transactionHistory = new TransactionHistory({
          userTransaction,
          sentTransaction,
        })

        const content = renderInitializeEscapePage({
          context,
          transactionHash: userTransaction.transactionHash,
          recipient: {
            starkKey: userTransaction.data.starkKey,
            ethereumAddress: txUser?.ethAddress,
          },
          dataFromL1: {
            asset: { hashOrId: context.collateralAsset.assetId },
            amount: userTransaction.data.withdrawalAmount,
          },
          positionOrVaultId: userTransaction.data.positionId.toString(),
          history: transactionHistory.getRegularTransactionHistory(),
          stateUpdateId: userTransaction.included?.stateUpdateId,
        })
        return { type: 'success', content }
      }

      case 'FinalizeEscape': {
        //TODO: Check if we need different for Spot and Perpetual
        if (context.tradingMode !== 'perpetual') {
          return { type: 'not found' }
        }
        const txUser =
          await this.userRegistrationEventRepository.findByStarkKey(
            userTransaction.data.starkKey
          )
        const transactionHistory = new TransactionHistory({
          userTransaction,
          sentTransaction,
        })

        const content = renderFinalizeEscapeDetailsPage({
          context,
          transactionHash: userTransaction.transactionHash,
          recipient: {
            starkKey: userTransaction.data.starkKey,
            ethereumAddress: txUser?.ethAddress,
          },
          asset: { hashOrId: context.collateralAsset.assetId },
          amount: userTransaction.data.quantizedAmount,
          positionOrVaultId:
            sentTransaction?.data.type === 'FinalizeEscape'
              ? sentTransaction.data.positionOrVaultId.toString()
              : undefined,
          history: transactionHistory.getRegularTransactionHistory(),
        })
        return { type: 'success', content }
      }
      case 'FreezeRequest': {
        const transactionHistory = new TransactionHistory({
          userTransaction,
          sentTransaction,
        })

        const txUser =
          sentTransaction?.data.type === 'FreezeRequest'
            ? await this.userRegistrationEventRepository.findByStarkKey(
                sentTransaction.data.starkKey
              )
            : undefined

        const content = renderFreezeRequestDetailsPage({
          context,
          transactionHash: userTransaction.transactionHash,
          ignored:
            sentTransaction?.data.type === 'FreezeRequest'
              ? {
                  starkKey: sentTransaction.data.starkKey,
                  ethereumAddress: txUser?.ethAddress,
                }
              : undefined,
          history: transactionHistory.getRegularTransactionHistory(),
        })
        return { type: 'success', content }
      }

      default:
        assertUnreachable(userTransaction.data)
    }
  }

  async getTransactionPageForSentTransaction(
    context: PageContext,
    sentTransaction: SentTransactionRecord,
    forcedTradeOffer: ForcedTradeOfferRecord | undefined
  ): Promise<ControllerResult> {
    switch (sentTransaction.data.type) {
      case 'ForcedTrade': {
        if (context.tradingMode != 'perpetual') {
          return { type: 'not found' }
        }

        const [userA, userB] = await Promise.all([
          this.userRegistrationEventRepository.findByStarkKey(
            sentTransaction.data.starkKeyA
          ),
          this.userRegistrationEventRepository.findByStarkKey(
            sentTransaction.data.starkKeyB
          ),
        ])

        if (!userA) {
          return { type: 'not found', message: 'User A not found' }
        }

        const maker = {
          starkKey: userA.starkKey,
          ethereumAddress: userA.ethAddress,
          positionId: sentTransaction.data.positionIdA.toString(),
        }
        const taker = userB
          ? {
              starkKey: userB.starkKey,
              ethereumAddress: userB.ethAddress,
              positionId: sentTransaction.data.positionIdB.toString(),
            }
          : undefined
        const transactionHistory = new TransactionHistory({
          forcedTradeOffer,
          sentTransaction,
        })
        const content = renderOfferAndForcedTradePage({
          context,
          transactionHash: sentTransaction.transactionHash,
          offerId: forcedTradeOffer?.id.toString(),
          maker,
          taker,
          type: sentTransaction.data.isABuyingSynthetic ? 'BUY' : 'SELL',
          collateralAmount: sentTransaction.data.collateralAmount,
          syntheticAsset: { hashOrId: sentTransaction.data.syntheticAssetId },
          syntheticAmount: sentTransaction.data.syntheticAmount,
          expirationTimestamp: sentTransaction.data.submissionExpirationTime,
          history: transactionHistory.getForcedTradeTransactionHistory(),
        })
        return { type: 'success', content }
      }
      case 'ForcedWithdrawal': {
        if (context.tradingMode != 'perpetual') {
          return { type: 'not found' }
        }
        const txUser =
          await this.userRegistrationEventRepository.findByStarkKey(
            sentTransaction.data.starkKey
          )
        const transactionHistory = new TransactionHistory({ sentTransaction })

        const content = renderPerpetualForcedWithdrawalPage({
          context,
          transactionHash: sentTransaction.transactionHash,
          recipient: {
            starkKey: sentTransaction.data.starkKey,
            ethereumAddress: txUser?.ethAddress,
          },
          asset: { hashOrId: context.collateralAsset.assetId },
          amount: sentTransaction.data.quantizedAmount,
          positionId: sentTransaction.data.positionId.toString(),
          history: transactionHistory.getForcedTransactionHistory(),
        })

        return { type: 'success', content }
      }

      case 'Withdraw': {
        const transactionHistory = new TransactionHistory({
          sentTransaction,
        })
        const data = sentTransaction.data
        const assetHash =
          context.tradingMode === 'perpetual'
            ? context.collateralAsset.assetId
            : data.assetType

        const recipient =
          await this.userRegistrationEventRepository.findByStarkKey(
            sentTransaction.data.starkKey
          )

        const content = renderRegularWithdrawalPage({
          context,
          transactionHash: sentTransaction.transactionHash,
          recipient: {
            starkKey: sentTransaction.data.starkKey,
            ethereumAddress: recipient?.ethAddress,
          },
          asset: { hashOrId: assetHash },
          history: transactionHistory.getRegularTransactionHistory(),
        })

        return { type: 'success', content }
      }

      case 'WithdrawWithTokenId': {
        const asset =
          await this.assetRepository.findDetailsByAssetTypeAndTokenId(
            sentTransaction.data.assetType,
            sentTransaction.data.tokenId
          )

        if (!asset) {
          return { type: 'not found', message: 'Asset not found' }
        }

        const recipient =
          await this.userRegistrationEventRepository.findByStarkKey(
            sentTransaction.data.starkKey
          )

        const transactionHistory = new TransactionHistory({
          sentTransaction,
        })

        const content = renderRegularWithdrawalPage({
          context,
          transactionHash: sentTransaction.transactionHash,
          recipient: {
            starkKey: sentTransaction.data.starkKey,
            ethereumAddress: recipient?.ethAddress,
          },
          asset: { hashOrId: asset.assetHash },
          history: transactionHistory.getRegularTransactionHistory(),
        })

        return { type: 'success', content }
      }

      case 'VerifyEscape': {
        //TODO: Check if we need different for Spot and Perpetual
        if (context.tradingMode !== 'perpetual') {
          return { type: 'not found' }
        }
        const txUser =
          await this.userRegistrationEventRepository.findByStarkKey(
            sentTransaction.data.starkKey
          )
        const transactionHistory = new TransactionHistory({
          sentTransaction,
        })

        const content = renderInitializeEscapePage({
          context,
          transactionHash: sentTransaction.transactionHash,
          recipient: {
            starkKey: sentTransaction.data.starkKey,
            ethereumAddress: txUser?.ethAddress,
          },
          positionOrVaultId: sentTransaction.data.positionOrVaultId.toString(),
          history: transactionHistory.getRegularTransactionHistory(),
        })

        return { type: 'success', content }
      }

      case 'FreezeRequest': {
        const transactionHistory = new TransactionHistory({
          sentTransaction,
        })
        const registeredUser =
          await this.userRegistrationEventRepository.findByStarkKey(
            sentTransaction.data.starkKey
          )

        const content = renderFreezeRequestDetailsPage({
          context,
          transactionHash: sentTransaction.transactionHash,
          ignored: {
            starkKey: sentTransaction.data.starkKey,
            ethereumAddress: registeredUser?.ethAddress,
          },
          history: transactionHistory.getRegularTransactionHistory(),
        })

        return { type: 'success', content }
      }

      case 'FinalizeEscape': {
        //TODO: Check if we need different for Spot and Perpetual
        if (context.tradingMode !== 'perpetual') {
          return { type: 'not found' }
        }
        const transactionHistory = new TransactionHistory({
          sentTransaction,
        })
        const registeredUser =
          await this.userRegistrationEventRepository.findByStarkKey(
            sentTransaction.data.starkKey
          )

        const content = renderFinalizeEscapeDetailsPage({
          context,
          transactionHash: sentTransaction.transactionHash,
          recipient: {
            starkKey: sentTransaction.data.starkKey,
            ethereumAddress: registeredUser?.ethAddress,
          },
          asset: { hashOrId: context.collateralAsset.assetId },
          amount: sentTransaction.data.quantizedAmount,
          positionOrVaultId: sentTransaction.data.positionOrVaultId.toString(),
          history: transactionHistory.getRegularTransactionHistory(),
        })
        return { type: 'success', content }
      }

      default:
        assertUnreachable(sentTransaction.data)
    }
  }
}
