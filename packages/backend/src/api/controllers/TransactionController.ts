import {
  renderOfferAndForcedTradePage,
  renderPerpetualForcedWithdrawalPage,
  renderRegularWithdrawalPage,
  renderSpotForcedWithdrawalPage,
} from '@explorer/frontend'
import { UserDetails } from '@explorer/shared'
import { EthereumAddress, Hash256, StarkKey, Timestamp } from '@explorer/types'

import { CollateralAsset } from '../../config/starkex/StarkexConfig'
import { UserService } from '../../core/UserService'
import {
  ForcedTradeOfferRepository,
  ForcedTradeOfferTransaction,
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
import { assertUnreachable } from '../../utils/assertUnreachable'
import { ControllerResult } from './ControllerResult'

export class TransactionController {
  constructor(
    private readonly userService: UserService,
    private readonly sentTransactionRepository: SentTransactionRepository,
    private readonly forcedTradeOfferRepository: ForcedTradeOfferRepository,
    private readonly userTransactionRepository: UserTransactionRepository,
    private readonly userRegistrationEventRepository: UserRegistrationEventRepository,
    private readonly collateralAsset?: CollateralAsset
  ) {}

  async getTransactionPage(
    givenUser: Partial<UserDetails>,
    txHash: Hash256
  ): Promise<ControllerResult> {
    const [
      user,
      sentTransaction,
      forcedTradeOfferTransaction,
      userTransaction,
    ] = await Promise.all([
      this.userService.getUserDetails(givenUser),
      this.sentTransactionRepository.findByTransactionHash(txHash),
      this.forcedTradeOfferRepository.findByTransactionHash(txHash),
      this.userTransactionRepository.findByTransactionHash(txHash),
    ])

    if (!userTransaction && !sentTransaction && !forcedTradeOfferTransaction) {
      return { type: 'not found', content: 'Transaction not found' }
    }
    let content

    if (sentTransaction && !forcedTradeOfferTransaction && !userTransaction) {
      content = await this.getTransactionPageForSentTransaction(
        user,
        sentTransaction
      )
    }
    if (!sentTransaction && forcedTradeOfferTransaction && !userTransaction) {
      content = await this.getTransactionPageForForcedTradeOfferTransaction(
        user,
        forcedTradeOfferTransaction
      )
    }

    if (userTransaction) {
      content = await this.getTransactionPageForUserTransaction(
        user,
        userTransaction,
        sentTransaction,
        forcedTradeOfferTransaction
      )
    }

    if (!content) {
      return {
        type: 'not found',
        content: "Transaction can't be displayed right now...",
      }
    }
    return { type: 'success', content }
  }
  async getTransactionPageForUserTransaction(
    user: UserDetails | undefined,
    userTransaction: UserTransactionRecord,
    sentTransaction: SentTransactionRecord | undefined,
    forcedTradeOfferTransaction: ForcedTradeOfferTransaction | undefined
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
        const history = buildTransactionHistory({
          sentTransaction,
          userTransaction,
        })
        return renderPerpetualForcedWithdrawalPage({
          user,
          transactionHash: userTransaction.transactionHash,
          recipient: {
            starkKey: userTransaction.data.starkKey,
            // TODO don't display ethereum address if unknown
            ethereumAddress: txUser?.ethAddress ?? EthereumAddress.ZERO,
          },
          asset: { hashOrId: this.collateralAsset.assetId },
          amount: userTransaction.data.quantizedAmount,
          positionId: userTransaction.data.positionId.toString(),
          history,
          stateUpdateId: userTransaction.included?.stateUpdateId,
        })
      }
      case 'FullWithdrawal': {
        const txUser =
          await this.userRegistrationEventRepository.findByStarkKey(
            userTransaction.data.starkKey
          )
        const history = buildTransactionHistory({
          sentTransaction,
          userTransaction,
        })
        return renderSpotForcedWithdrawalPage({
          user,
          transactionHash: userTransaction.transactionHash,
          recipient: {
            starkKey: userTransaction.data.starkKey,
            // TODO don't display ethereum address if unknown
            ethereumAddress: txUser?.ethAddress ?? EthereumAddress.ZERO,
          },
          vaultId: userTransaction.data.vaultId.toString(),
          history,
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
          // TODO don't display ethereum address if unknown
          ethereumAddress: userA.ethAddress,
          positionId: userTransaction.data.positionIdA.toString(),
        }
        const taker =
          userB === undefined
            ? undefined
            : {
                starkKey: userB.starkKey,
                // TODO don't display ethereum address if unknown
                ethereumAddress: userB.ethAddress,
                positionId: userTransaction.data.positionIdB.toString(),
              }
        const history = buildForcedTradeTransactionHistory({
          forcedTradeOfferTransaction,
          sentTransaction,
          userTransaction,
        })
        return renderOfferAndForcedTradePage({
          user,
          transactionHash: userTransaction.transactionHash,
          offerId: '-', // TODO: pass correct data
          maker,
          taker,
          type: userTransaction.data.isABuyingSynthetic ? 'BUY' : 'SELL',
          collateralAsset: { hashOrId: userTransaction.data.collateralAssetId },
          collateralAmount: userTransaction.data.collateralAmount,
          syntheticAsset: { hashOrId: userTransaction.data.syntheticAssetId },
          syntheticAmount: userTransaction.data.syntheticAmount,
          expirationTimestamp: userTransaction.timestamp, // TODO: fix
          history,
          stateUpdateId: userTransaction.included?.stateUpdateId,
        })
      }
      case 'Withdraw':
      case 'WithdrawWithTokenId':
      case 'MintWithdraw': {
        const history = buildRegularTransactionHistory({
          sentTransaction,
          userTransaction,
        })
        const data = userTransaction.data
        const assetHash =
          data.type === 'Withdraw'
            ? this.collateralAsset
              ? this.collateralAsset.assetId
              : data.assetType
            : data.type === 'WithdrawWithTokenId'
            ? data.assetId
            : data.assetId

        let recipientEthAddress =
          data.type === 'Withdraw'
            ? data.recipient
            : data.type === 'WithdrawWithTokenId'
            ? data.recipient
            : undefined

        if (recipientEthAddress === undefined) {
          const recipient =
            await this.userRegistrationEventRepository.findByStarkKey(
              userTransaction.data.starkKey
            )
          // TODO handle lack of recipient address
          recipientEthAddress = recipient?.ethAddress
        }
        return renderRegularWithdrawalPage({
          user,
          transactionHash: userTransaction.transactionHash,
          recipient: {
            // TODO don't display starkKey if unknown
            starkKey: StarkKey.ZERO,
            // TODO don't display ethereum address if unknown
            ethereumAddress: recipientEthAddress ?? EthereumAddress.ZERO,
          },
          asset: { hashOrId: assetHash },
          amount: userTransaction.data.quantizedAmount,
          history,
          stateUpdateId: userTransaction.included?.stateUpdateId,
        })
      }
      default:
        assertUnreachable(userTransaction.data)
    }
  }

  async getTransactionPageForSentTransaction(
    user: UserDetails | undefined,
    sentTransaction: SentTransactionRecord
  ): Promise<string | undefined> {
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
          // TODO don't display ethereum address if unknown
          ethereumAddress: userA.ethAddress,
          positionId: sentTransaction.data.positionIdA.toString(),
        }
        const taker = userB
          ? {
              starkKey: userB.starkKey,
              // TODO don't display ethereum address if unknown
              ethereumAddress: userB.ethAddress,
              positionId: sentTransaction.data.positionIdB.toString(),
            }
          : undefined
        const history = buildForcedTradeTransactionHistory({ sentTransaction })
        return renderOfferAndForcedTradePage({
          user,
          transactionHash: sentTransaction.transactionHash,
          offerId: '-', // TODO: pass correct data
          maker,
          taker,
          type: sentTransaction.data.isABuyingSynthetic ? 'BUY' : 'SELL',
          collateralAsset: { hashOrId: sentTransaction.data.collateralAssetId },
          collateralAmount: sentTransaction.data.collateralAmount,
          syntheticAsset: { hashOrId: sentTransaction.data.syntheticAssetId },
          syntheticAmount: sentTransaction.data.syntheticAmount,
          expirationTimestamp: sentTransaction.data.submissionExpirationTime, // TODO: fix
          history,
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
        const history = buildTransactionHistory({ sentTransaction })

        return renderPerpetualForcedWithdrawalPage({
          user,
          transactionHash: sentTransaction.transactionHash,
          recipient: {
            starkKey: sentTransaction.data.starkKey,
            // TODO don't display ethereum address if unknown
            ethereumAddress: txUser?.ethAddress ?? EthereumAddress.ZERO,
          },
          asset: { hashOrId: this.collateralAsset.assetId },
          amount: sentTransaction.data.quantizedAmount,
          positionId: sentTransaction.data.positionId.toString(),
          history,
        })
      }

      case 'Withdraw':
        throw new Error('Withdraw not supported')

      default:
        assertUnreachable(sentTransaction.data)
    }
  }

  async getTransactionPageForForcedTradeOfferTransaction(
    user: UserDetails | undefined,
    forcedTradeOfferTransaction: ForcedTradeOfferTransaction
  ) {
    if (!this.collateralAsset) {
      throw new Error(
        'Collateral asset not passed when displaying ForcedTradeOffer'
      )
    }
    const userA = await this.userRegistrationEventRepository.findByStarkKey(
      forcedTradeOfferTransaction.starkKeyA
    )
    const userB = forcedTradeOfferTransaction.accepted
      ? await this.userRegistrationEventRepository.findByStarkKey(
          forcedTradeOfferTransaction.accepted.starkKeyB
        )
      : undefined

    if (!userA) {
      throw new Error('User A not found')
    }
    const maker = {
      starkKey: userA.starkKey,
      // TODO don't display ethereum address if unknown
      ethereumAddress: userA.ethAddress,
      positionId: forcedTradeOfferTransaction.positionIdA.toString(),
    }
    const taker =
      userB && forcedTradeOfferTransaction.accepted
        ? {
            starkKey: userB.starkKey,
            // TODO don't display ethereum address if unknown
            ethereumAddress: userB.ethAddress,
            positionId:
              forcedTradeOfferTransaction.accepted.positionIdB.toString(),
          }
        : undefined
    const history = buildForcedTradeTransactionHistory({
      forcedTradeOfferTransaction,
    })
    return renderOfferAndForcedTradePage({
      user,
      transactionHash: forcedTradeOfferTransaction.accepted?.transactionHash,
      offerId: forcedTradeOfferTransaction.id.toString(),
      maker,
      taker,
      type: forcedTradeOfferTransaction.isABuyingSynthetic ? 'BUY' : 'SELL',
      //TODO: Take correct collateralAssetId
      collateralAsset: { hashOrId: this.collateralAsset.assetId },
      collateralAmount: forcedTradeOfferTransaction.collateralAmount,
      syntheticAsset: {
        hashOrId: forcedTradeOfferTransaction.syntheticAssetId,
      },
      syntheticAmount: forcedTradeOfferTransaction.syntheticAmount,
      expirationTimestamp: forcedTradeOfferTransaction.accepted
        ?.submissionExpirationTime
        ? Timestamp(
            forcedTradeOfferTransaction.accepted.submissionExpirationTime
          )
        : undefined,
      history,
    })
  }
}

type TransactionStatus =
  | 'CREATED'
  | 'CANCELLED'
  | 'ACCEPTED'
  | 'EXPIRED'
  | 'SENT'
  | 'REVERTED'
  | 'MINED'
  | 'INCLUDED'

interface TransactionHistoryItem<
  T extends TransactionStatus = TransactionStatus
> {
  timestamp: Timestamp | undefined
  status: T
}

interface TransactionHistoryArgs {
  userTransaction?: UserTransactionRecord
  sentTransaction?: SentTransactionRecord
  forcedTradeOfferTransaction?: ForcedTradeOfferTransaction
}

function buildRegularTransactionHistory({
  sentTransaction,
  userTransaction,
}: Omit<
  TransactionHistoryArgs,
  'forcedTradeOfferTransaction'
>): TransactionHistoryItem<'SENT' | 'REVERTED' | 'MINED'>[] {
  const history: TransactionHistoryItem<'SENT' | 'REVERTED' | 'MINED'>[] = []

  if (sentTransaction?.mined?.reverted) {
    history.push({
      timestamp: sentTransaction.mined.timestamp,
      status: 'REVERTED',
    })
  }

  if (sentTransaction?.mined || userTransaction) {
    history.push({
      status: 'MINED',
      timestamp:
        sentTransaction?.mined?.timestamp ?? userTransaction?.timestamp,
    })
  }

  history.push({
    timestamp: sentTransaction?.sentTimestamp,
    status: 'SENT',
  })
  return history
}

function buildTransactionHistory({
  sentTransaction,
  userTransaction,
}: Omit<
  TransactionHistoryArgs,
  'forcedTradeOfferTransaction'
>): TransactionHistoryItem<'SENT' | 'REVERTED' | 'MINED' | 'INCLUDED'>[] {
  const history: TransactionHistoryItem<
    'SENT' | 'REVERTED' | 'MINED' | 'INCLUDED'
  >[] = []

  if (userTransaction?.included) {
    history.push({
      timestamp: userTransaction.included.timestamp,
      status: 'INCLUDED',
    })
  }

  history.push(
    ...buildRegularTransactionHistory({ sentTransaction, userTransaction })
  )

  return history
}

function buildForcedTradeTransactionHistory({
  forcedTradeOfferTransaction,
  sentTransaction,
  userTransaction,
}: TransactionHistoryArgs): TransactionHistoryItem[] {
  const history: TransactionHistoryItem[] = []
  history.push(
    ...buildRegularTransactionHistory({ sentTransaction, userTransaction })
  )
  if (!forcedTradeOfferTransaction && !sentTransaction && !userTransaction) {
    return history
  }

  if (forcedTradeOfferTransaction?.cancelledAt) {
    history.push({
      timestamp: forcedTradeOfferTransaction.cancelledAt,
      status: 'CANCELLED',
    })
  }
  if (
    forcedTradeOfferTransaction?.accepted?.at ||
    sentTransaction ||
    userTransaction
  ) {
    if (
      forcedTradeOfferTransaction?.accepted?.submissionExpirationTime &&
      Timestamp(forcedTradeOfferTransaction.accepted.submissionExpirationTime) <
        Timestamp.now()
    ) {
      history.push({
        timestamp: Timestamp(
          forcedTradeOfferTransaction.accepted.submissionExpirationTime
        ),
        status: 'EXPIRED',
      })
    }
    history.push({
      timestamp: forcedTradeOfferTransaction?.accepted?.at,
      status: 'ACCEPTED',
    })
  }
  history.push({
    timestamp: forcedTradeOfferTransaction?.createdAt,
    status: 'CREATED',
  })

  return history
}
