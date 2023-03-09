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

    // TODO: cover the case where there is ONLY a sentTransaction
    if (!userTransaction) {
      return { type: 'not found', content: 'Transaction not found' }
    }

    let content
    if (userTransaction.data.type === 'ForcedWithdrawal') {
      if (!this.collateralAsset) {
        throw new Error(
          'Collateral asset not passed when displaying ForcedWithdrawal'
        )
      }
      const txUser = await this.userRegistrationEventRepository.findByStarkKey(
        userTransaction.data.starkKey
      )
      const history = buildTransactionHistory(sentTransaction, userTransaction)
      content = renderPerpetualForcedWithdrawalPage({
        user,
        transactionHash: txHash,
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

    if (userTransaction.data.type === 'FullWithdrawal') {
      const txUser = await this.userRegistrationEventRepository.findByStarkKey(
        userTransaction.data.starkKey
      )
      const history = buildTransactionHistory(sentTransaction, userTransaction)
      content = renderSpotForcedWithdrawalPage({
        user,
        transactionHash: txHash,
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

    if (userTransaction.data.type === 'ForcedTrade') {
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
      const history = buildForcedTradeTransactionHistory(
        sentTransaction,
        forcedTradeOfferTransaction,
        userTransaction
      )
      content = renderOfferAndForcedTradePage({
        user,
        transactionHash: txHash,
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

    if (
      userTransaction.data.type === 'Withdraw' ||
      userTransaction.data.type === 'WithdrawWithTokenId' ||
      userTransaction.data.type === 'MintWithdraw'
    ) {
      const history = buildRegularTransactionHistory(
        sentTransaction,
        userTransaction
      )
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

      content = renderRegularWithdrawalPage({
        user,
        transactionHash: txHash,
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

    if (!content) {
      return {
        type: 'not found',
        content: "Transaction can't be displayed right now...",
      }
    }
    return { type: 'success', content }
  }
}

interface HistoryItem<
  T extends
    | 'CREATED'
    | 'CANCELLED'
    | 'ACCEPTED'
    | 'EXPIRED'
    | 'SENT'
    | 'REVERTED'
    | 'MINED'
    | 'INCLUDED'
> {
  timestamp: Timestamp | undefined
  status: T
}

function buildRegularTransactionHistory(
  sentTransaction: SentTransactionRecord | undefined,
  userTransaction: UserTransactionRecord
): HistoryItem<'SENT' | 'REVERTED' | 'MINED'>[] {
  const history: HistoryItem<'SENT' | 'REVERTED' | 'MINED'>[] = []
  history.push({
    status: 'MINED',
    timestamp: userTransaction.timestamp,
  })
  if (sentTransaction?.mined?.reverted) {
    history.push({
      timestamp: sentTransaction.mined.timestamp,
      status: 'REVERTED',
    })
  }
  history.push({
    timestamp: sentTransaction?.sentTimestamp,
    status: 'SENT',
  })
  return history
}

function buildTransactionHistory(
  sentTransaction: SentTransactionRecord | undefined,
  userTransaction: UserTransactionRecord
): HistoryItem<'SENT' | 'REVERTED' | 'MINED' | 'INCLUDED'>[] {
  const history: HistoryItem<'SENT' | 'REVERTED' | 'MINED' | 'INCLUDED'>[] = []
  if (userTransaction.included) {
    history.push({
      timestamp: userTransaction.included.timestamp,
      status: 'INCLUDED',
    })
  }
  history.push(
    ...buildRegularTransactionHistory(sentTransaction, userTransaction)
  )

  return history
}

function buildForcedTradeTransactionHistory(
  sentTransaction: SentTransactionRecord | undefined,
  forcedTradeOfferTransaction: ForcedTradeOfferTransaction | undefined,
  userTransaction: UserTransactionRecord
): HistoryItem<
  | 'CREATED'
  | 'CANCELLED'
  | 'ACCEPTED'
  | 'EXPIRED'
  | 'SENT'
  | 'REVERTED'
  | 'MINED'
  | 'INCLUDED'
>[] {
  const history: HistoryItem<
    | 'CREATED'
    | 'CANCELLED'
    | 'ACCEPTED'
    | 'EXPIRED'
    | 'SENT'
    | 'REVERTED'
    | 'MINED'
    | 'INCLUDED'
  >[] = []
  history.push(...buildTransactionHistory(sentTransaction, userTransaction))

  /*
    TODO: Right now it's not possible to have a forcedTradeOfferTransaction without a userTransaction, but probably it should be possible.
    TODO: Remove the eslint-disable-next-line @typescript-eslint/no-unnecessary-condition when it's possible to have a forcedTradeOfferTransaction without a userTransaction
  */

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
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
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
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
