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
    private readonly userTransactionRepository: UserTransactionRepository,
    private readonly userRegistrationEventRepository: UserRegistrationEventRepository,
    private readonly collateralAsset?: CollateralAsset
  ) {}

  async getTransactionPage(
    givenUser: Partial<UserDetails>,
    txHash: Hash256
  ): Promise<ControllerResult> {
    const [user, sentTransaction, userTransaction] = await Promise.all([
      this.userService.getUserDetails(givenUser),
      this.sentTransactionRepository.findByTransactionHash(txHash),
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
      const history = buildForcedActionHistory(sentTransaction, userTransaction)
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
      const history = buildForcedActionHistory(sentTransaction, userTransaction)
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
      const history = buildForcedActionHistory(sentTransaction, userTransaction)
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
        // TODO construct proper history:
        // history: {
        //   timestamp: Timestamp
        //   status:
        //     | 'CREATED'
        //     | 'CANCELLED'
        //     | 'ACCEPTED'
        //     | 'EXPIRED'
        //     | 'SENT'
        //     | 'MINED'
        //     | 'REVERTED'
        //     | 'INCLUDED'
        // }[]
        stateUpdateId: userTransaction.included?.stateUpdateId,
      })
    }

    if (
      userTransaction.data.type === 'Withdraw' ||
      userTransaction.data.type === 'WithdrawWithTokenId' ||
      userTransaction.data.type === 'MintWithdraw'
    ) {
      const history = buildRegularHistory(sentTransaction, userTransaction)
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

function buildRegularHistory(
  sentTransaction: SentTransactionRecord | undefined,
  userTransaction: UserTransactionRecord
): { timestamp: Timestamp; status: 'SENT' | 'REVERTED' | 'MINED' }[] {
  const history: {
    timestamp: Timestamp
    status: 'SENT' | 'REVERTED' | 'MINED'
  }[] = []
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
  if (sentTransaction) {
    history.push({
      timestamp: sentTransaction.sentTimestamp,
      status: 'SENT',
    })
  }
  return history
}

function buildForcedActionHistory(
  sentTransaction: SentTransactionRecord | undefined,
  userTransaction: UserTransactionRecord
): {
  timestamp: Timestamp
  status: 'SENT' | 'REVERTED' | 'MINED' | 'INCLUDED'
}[] {
  const history: {
    timestamp: Timestamp
    status: 'SENT' | 'REVERTED' | 'MINED' | 'INCLUDED'
  }[] = []
  if (userTransaction.included) {
    history.push({
      timestamp: userTransaction.included.timestamp,
      status: 'INCLUDED',
    })
  }
  history.push(...buildRegularHistory(sentTransaction, userTransaction))
  return history
}
