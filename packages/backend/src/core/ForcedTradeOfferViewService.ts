import { OfferEntry } from '@explorer/frontend'
import { Hash256, StarkKey } from '@explorer/types'

import { buildForcedTradeTransactionHistory } from '../api/controllers/utils/buildTransactionHistory'
import { ForcedTradeOfferRecord } from '../peripherals/database/ForcedTradeOfferRepository'
import {
  SentTransactionRecord,
  SentTransactionRepository,
} from '../peripherals/database/transactions/SentTransactionRepository'
import {
  UserTransactionRecord,
  UserTransactionRepository,
} from '../peripherals/database/transactions/UserTransactionRepository'

export class ForcedTradeOfferViewService {
  constructor(
    private readonly userTransactionRepository: UserTransactionRepository,
    private readonly sentTransactionRepository: SentTransactionRepository
  ) {}
  async aggregatedForcedTradeOffersToEntry(
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
      return this.forcedTradeOfferToEntry(
        forcedTradeOffer,
        sentTransaction,
        userTransaction,
        userStarkKey
      )
    })
  }

  forcedTradeOfferToEntry(
    forcedTradeOffer: ForcedTradeOfferRecord,
    sentTransaction?: SentTransactionRecord,
    userTransaction?: UserTransactionRecord,
    userStarkKey?: StarkKey
  ): OfferEntry {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const status = buildForcedTradeTransactionHistory({
      forcedTradeOffer,
      sentTransaction,
      userTransaction,
    })[0]!.status

    const role =
      forcedTradeOffer.starkKeyA === userStarkKey
        ? 'MAKER'
        : forcedTradeOffer.accepted?.starkKeyB === userStarkKey
        ? 'TAKER'
        : undefined

    return {
      id: forcedTradeOffer.id.toString(),
      timestamp: forcedTradeOffer.createdAt,
      asset: {
        hashOrId: forcedTradeOffer.syntheticAssetId,
      },
      amount: forcedTradeOffer.syntheticAmount,
      price: 0n, //TODO: calculate price
      totalPrice: 0n * forcedTradeOffer.syntheticAmount,
      status,
      type: forcedTradeOffer.isABuyingSynthetic ? 'BUY' : 'SELL',
      role,
    }
  }
}
