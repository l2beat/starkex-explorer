import {
  renderOfferAndForcedTradePage,
  renderPerpetualForcedWithdrawalPage,
  renderRegularWithdrawalPage,
  renderSpotForcedWithdrawalPage,
} from '@explorer/frontend'
import { assertUnreachable, UserDetails } from '@explorer/shared'
import { Hash256 } from '@explorer/types'

import { CollateralAsset } from '../../config/starkex/StarkexConfig'
import { TransactionHistory } from '../../core/TransactionHistory'
import { UserService } from '../../core/UserService'
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
    private readonly userService: UserService,
    private readonly sentTransactionRepository: SentTransactionRepository,
    private readonly forcedTradeOfferRepository: ForcedTradeOfferRepository,
    private readonly userTransactionRepository: UserTransactionRepository,
    private readonly userRegistrationEventRepository: UserRegistrationEventRepository,
    private readonly assetRepository: AssetRepository,
    private readonly collateralAsset?: CollateralAsset
  ) {}

  async getTransactionPage(
    givenUser: Partial<UserDetails>,
    txHash: Hash256
  ): Promise<ControllerResult> {
    const [user, sentTransaction, forcedTradeOffer, userTransaction] =
      await Promise.all([
        this.userService.getUserDetails(givenUser),
        this.sentTransactionRepository.findByTransactionHash(txHash),
        this.forcedTradeOfferRepository.findByTransactionHash(txHash),
        this.userTransactionRepository.findByTransactionHash(txHash),
      ])

    if (sentTransaction && !userTransaction) {
      const content = await this.getTransactionPageForSentTransaction(
        user,
        sentTransaction,
        forcedTradeOffer
      )
      return { type: 'success', content }
    }

    if (userTransaction) {
      const content = await this.getTransactionPageForUserTransaction(
        user,
        userTransaction,
        sentTransaction,
        forcedTradeOffer
      )

      return { type: 'success', content }
    }

    return { type: 'not found', content: 'Transaction not found' }
  }

  async getTransactionPageForUserTransaction(
    user: UserDetails | undefined,
    userTransaction: UserTransactionRecord,
    sentTransaction: SentTransactionRecord | undefined,
    forcedTradeOffer: ForcedTradeOfferRecord | undefined
  ) {
    switch (userTransaction.data.type) {
      case 'ForcedWithdrawal': {
        if (!this.collateralAsset) {
          throw new Error(
            'Collateral asset not passed when displaying ForcedWithdrawal'
          )
        }
        const txUser =
          await this.userRegistrationEventRepository.findByStarkKey(
            userTransaction.data.starkKey
          )
        const transactionHistory = new TransactionHistory({
          sentTransaction: sentTransaction,
          userTransaction: userTransaction,
        })

        return renderPerpetualForcedWithdrawalPage({
          user,
          transactionHash: userTransaction.transactionHash,
          recipient: {
            starkKey: userTransaction.data.starkKey,
            ethereumAddress: txUser?.ethAddress,
          },
          asset: { hashOrId: this.collateralAsset.assetId },
          amount: userTransaction.data.quantizedAmount,
          positionId: userTransaction.data.positionId.toString(),
          history: transactionHistory.getForcedTransactionHistory(),
          stateUpdateId: userTransaction.included?.stateUpdateId,
        })
      }
      case 'FullWithdrawal': {
        const txUser =
          await this.userRegistrationEventRepository.findByStarkKey(
            userTransaction.data.starkKey
          )
        const transactionHistory = new TransactionHistory({
          sentTransaction,
          userTransaction,
        })
        return renderSpotForcedWithdrawalPage({
          user,
          transactionHash: userTransaction.transactionHash,
          recipient: {
            starkKey: userTransaction.data.starkKey,
            ethereumAddress: txUser?.ethAddress,
          },
          vaultId: userTransaction.data.vaultId.toString(),
          history: transactionHistory.getForcedTransactionHistory(),
          stateUpdateId: userTransaction.included?.stateUpdateId,
        })
      }
      case 'ForcedTrade': {
        const [userA, userB] = await Promise.all([
          this.userRegistrationEventRepository.findByStarkKey(
            userTransaction.data.starkKeyA
          ),
          this.userRegistrationEventRepository.findByStarkKey(
            userTransaction.data.starkKeyB
          ),
        ])
        if (!userA) {
          throw new Error('User A not found')
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
        return renderOfferAndForcedTradePage({
          user,
          transactionHash: userTransaction.transactionHash,
          offerId: forcedTradeOffer?.id.toString(),
          maker,
          taker,
          type: userTransaction.data.isABuyingSynthetic ? 'BUY' : 'SELL',
          collateralAsset: { hashOrId: userTransaction.data.collateralAssetId },
          collateralAmount: userTransaction.data.collateralAmount,
          syntheticAsset: { hashOrId: userTransaction.data.syntheticAssetId },
          syntheticAmount: userTransaction.data.syntheticAmount,
          expirationTimestamp: forcedTradeOffer?.accepted
            ? forcedTradeOffer.accepted.submissionExpirationTime
            : undefined,
          history: transactionHistory.getForcedTradeTransactionHistory(),
          stateUpdateId: userTransaction.included?.stateUpdateId,
        })
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
            ? this.collateralAsset
              ? this.collateralAsset.assetId
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
        return renderRegularWithdrawalPage({
          user,
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
      }
      default:
        assertUnreachable(userTransaction.data)
    }
  }

  async getTransactionPageForSentTransaction(
    user: UserDetails | undefined,
    sentTransaction: SentTransactionRecord,
    forcedTradeOffer: ForcedTradeOfferRecord | undefined
  ) {
    switch (sentTransaction.data.type) {
      case 'ForcedTrade': {
        const [userA, userB] = await Promise.all([
          this.userRegistrationEventRepository.findByStarkKey(
            sentTransaction.data.starkKeyA
          ),
          this.userRegistrationEventRepository.findByStarkKey(
            sentTransaction.data.starkKeyB
          ),
        ])
        if (!userA) {
          throw new Error('User A not found')
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
        return renderOfferAndForcedTradePage({
          user,
          transactionHash: sentTransaction.transactionHash,
          offerId: forcedTradeOffer?.id.toString(),
          maker,
          taker,
          type: sentTransaction.data.isABuyingSynthetic ? 'BUY' : 'SELL',
          collateralAsset: { hashOrId: sentTransaction.data.collateralAssetId },
          collateralAmount: sentTransaction.data.collateralAmount,
          syntheticAsset: { hashOrId: sentTransaction.data.syntheticAssetId },
          syntheticAmount: sentTransaction.data.syntheticAmount,
          expirationTimestamp: sentTransaction.data.submissionExpirationTime,
          history: transactionHistory.getForcedTradeTransactionHistory(),
        })
      }
      case 'ForcedWithdrawal': {
        if (!this.collateralAsset) {
          throw new Error(
            'Collateral asset not passed when displaying ForcedWithdrawal'
          )
        }
        const txUser =
          await this.userRegistrationEventRepository.findByStarkKey(
            sentTransaction.data.starkKey
          )
        const transactionHistory = new TransactionHistory({ sentTransaction })

        return renderPerpetualForcedWithdrawalPage({
          user,
          transactionHash: sentTransaction.transactionHash,
          recipient: {
            starkKey: sentTransaction.data.starkKey,
            ethereumAddress: txUser?.ethAddress,
          },
          asset: { hashOrId: this.collateralAsset.assetId },
          amount: sentTransaction.data.quantizedAmount,
          positionId: sentTransaction.data.positionId.toString(),
          history: transactionHistory.getForcedTransactionHistory(),
        })
      }

      case 'Withdraw': {
        const transactionHistory = new TransactionHistory({
          sentTransaction,
        })
        const data = sentTransaction.data
        const assetHash = this.collateralAsset
          ? this.collateralAsset.assetId
          : data.assetType

        const recipient =
          await this.userRegistrationEventRepository.findByStarkKey(
            sentTransaction.data.starkKey
          )

        return renderRegularWithdrawalPage({
          user,
          transactionHash: sentTransaction.transactionHash,
          recipient: {
            starkKey: sentTransaction.data.starkKey,
            ethereumAddress: recipient?.ethAddress,
          },
          asset: { hashOrId: assetHash },
          history: transactionHistory.getRegularTransactionHistory(),
        })
      }

      case 'WithdrawWithTokenId': {
        const asset =
          await this.assetRepository.findDetailsByAssetTypeAndTokenId(
            sentTransaction.data.assetType,
            sentTransaction.data.tokenId
          )

        if (!asset) {
          throw new Error('Asset not found')
        }

        const recipient =
          await this.userRegistrationEventRepository.findByStarkKey(
            sentTransaction.data.starkKey
          )

        const transactionHistory = new TransactionHistory({
          sentTransaction,
        })

        return renderRegularWithdrawalPage({
          user,
          transactionHash: sentTransaction.transactionHash,
          recipient: {
            starkKey: sentTransaction.data.starkKey,
            ethereumAddress: recipient?.ethAddress,
          },
          asset: { hashOrId: asset.assetHash },
          history: transactionHistory.getRegularTransactionHistory(),
        })
      }

      default:
        assertUnreachable(sentTransaction.data)
    }
  }
}
