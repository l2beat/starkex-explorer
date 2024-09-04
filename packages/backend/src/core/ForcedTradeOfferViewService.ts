import { FinalizableOfferEntry, OfferEntry } from '@explorer/frontend'
import { Hash256, StarkKey } from '@explorer/types'

import { ForcedTradeOfferRecord } from '../peripherals/database/ForcedTradeOfferRepository'
import {
  SentTransactionRecord,
  SentTransactionRepository,
} from '../peripherals/database/transactions/SentTransactionRepository'
import {
  UserTransactionRecord,
  UserTransactionRepository,
} from '../peripherals/database/transactions/UserTransactionRepository'
import { TransactionHistory } from './TransactionHistory'

export class ForcedTradeOfferViewService {
  constructor(
    private readonly userTransactionRepository: UserTransactionRepository,
    private readonly sentTransactionRepository: SentTransactionRepository
  ) {}

  async toEntriesWithFullHistory(
    forcedTradeOffers: ForcedTradeOfferRecord[],
    userStarkKey?: StarkKey
  ) {
    const transactionHashes = forcedTradeOffers
      .map((forcedTradeOffer) => forcedTradeOffer.accepted?.transactionHash)
      .filter((transactionHash): transactionHash is Hash256 =>
        Hash256.check(transactionHash)
      )
    const [userTransactions, sentTransactions] = await Promise.all([
      this.userTransactionRepository.getByTransactionHashes(transactionHashes),
      this.sentTransactionRepository.getByTransactionHashes(transactionHashes),
    ])

    return forcedTradeOffers.map((forcedTradeOffer) => {
      const userTransaction = userTransactions.find(
        (userTransaction) =>
          userTransaction.transactionHash ===
          forcedTradeOffer.accepted?.transactionHash
      )
      const sentTransaction = sentTransactions.find(
        (sentTransaction) =>
          sentTransaction.transactionHash ===
          forcedTradeOffer.accepted?.transactionHash
      )
      return this.toOfferEntry(
        forcedTradeOffer,
        sentTransaction,
        userTransaction,
        userStarkKey
      )
    })
  }

  toOfferEntry(
    forcedTradeOffer: ForcedTradeOfferRecord,
    sentTransaction?: SentTransactionRecord,
    userTransaction?: UserTransactionRecord,
    userStarkKey?: StarkKey
  ): OfferEntry {
    const transactionHistory = new TransactionHistory({
      forcedTradeOffer,
      sentTransaction,
      userTransaction,
    })
    const status = transactionHistory.getLatestForcedTradeTransactionStatus()

    const role =
      forcedTradeOffer.starkKeyA === userStarkKey
        ? 'MAKER'
        : forcedTradeOffer.accepted?.starkKeyB === userStarkKey
        ? 'TAKER'
        : undefined

    return {
      id: forcedTradeOffer.id.toString(),
      timestamp: forcedTradeOffer.createdAt,
      syntheticAsset: {
        hashOrId: forcedTradeOffer.syntheticAssetId,
      },
      syntheticAmount: forcedTradeOffer.syntheticAmount,
      collateralAmount: forcedTradeOffer.collateralAmount,
      status,
      type: forcedTradeOffer.isABuyingSynthetic ? 'BUY' : 'SELL',
      role,
    }
  }

  toFinalizableOfferEntry(
    forcedTradeOffer: ForcedTradeOfferRecord
  ): FinalizableOfferEntry {
    return {
      timestamp: forcedTradeOffer.createdAt,
      id: forcedTradeOffer.id.toString(),
      syntheticAsset: {
        hashOrId: forcedTradeOffer.syntheticAssetId,
      },
      syntheticAmount: forcedTradeOffer.syntheticAmount,
      collateralAmount: forcedTradeOffer.collateralAmount,
      type: forcedTradeOffer.isABuyingSynthetic ? 'BUY' : 'SELL',
    }
  }
}
