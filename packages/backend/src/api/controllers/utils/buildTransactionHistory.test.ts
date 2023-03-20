import { AssetId, Hash256, StarkKey, Timestamp } from '@explorer/types'
import { expect } from 'earljs'

import { ForcedTradeOfferRecord } from '../../../peripherals/database/ForcedTradeOfferRepository'
import { SentTransactionRecord } from '../../../peripherals/database/transactions/SentTransactionRepository'
import { UserTransactionRecord } from '../../../peripherals/database/transactions/UserTransactionRepository'
import {
  buildForcedTradeTransactionHistory,
  buildForcedTransactionHistory,
  buildRegularTransactionHistory,
} from './buildTransactionHistory'

describe(buildForcedTradeTransactionHistory.name, () => {
  it('should return correct history for created offer', () => {
    const offer = forcedTradeOffer()

    const history = buildForcedTradeTransactionHistory({
      forcedTradeOffer: offer,
    })

    expect(history).toEqual([
      {
        timestamp: offer.createdAt,
        status: 'CREATED',
      },
    ])
  })

  it('should return correct history for cancelled offer', () => {
    const offer = forcedTradeOffer({ cancelled: true })

    const history = buildForcedTradeTransactionHistory({
      forcedTradeOffer: offer,
    })

    expect(history).toEqual([
      {
        timestamp: offer.cancelledAt,
        status: 'CANCELLED',
      },
      {
        timestamp: offer.createdAt,
        status: 'CREATED',
      },
    ])
  })

  it('should return correct history for accepted offer', () => {
    const offer = forcedTradeOffer({ accepted: true })

    const history = buildForcedTradeTransactionHistory({
      forcedTradeOffer: offer,
    })

    expect(history).toEqual([
      {
        timestamp: offer.accepted?.at,
        status: 'ACCEPTED',
      },
      {
        timestamp: offer.createdAt,
        status: 'CREATED',
      },
    ])
  })

  it('should return correct history for expired offer', () => {
    const offer = forcedTradeOffer({ accepted: true, expired: true })

    const history = buildForcedTradeTransactionHistory({
      forcedTradeOffer: offer,
    })

    expect(history).toEqual([
      {
        timestamp: offer.accepted?.submissionExpirationTime,
        status: 'EXPIRED',
      },
      {
        timestamp: offer.accepted?.at,
        status: 'ACCEPTED',
      },
      {
        timestamp: offer.createdAt,
        status: 'CREATED',
      },
    ])
  })
})

describe(buildForcedTransactionHistory.name, () => {
  it('should return correct history for userTransaction', () => {
    const userTx = userTransaction({ included: true })
    const history = buildForcedTransactionHistory({
      userTransaction: userTx,
    })

    expect(history).toEqual([
      {
        timestamp: userTx.included?.timestamp,
        status: 'INCLUDED',
      },
      {
        timestamp: userTx.timestamp,
        status: 'MINED',
      },
      {
        timestamp: undefined,
        status: 'SENT',
      },
    ])
  })
})

describe(buildRegularTransactionHistory.name, () => {
  describe('sentTransaction', () => {
    it('should return correct history for sentTransaction', () => {
      const sentTx = sentTransaction()
      const history = buildRegularTransactionHistory({
        sentTransaction: sentTx,
      })
      expect(history).toEqual([
        {
          timestamp: sentTx.sentTimestamp,
          status: 'SENT',
        },
      ])
    })
    it('should return correct history for sentTransaction that was mined', () => {
      const sentTx = sentTransaction({ mined: true })
      const history = buildRegularTransactionHistory({
        sentTransaction: sentTx,
      })
      expect(history).toEqual([
        {
          timestamp: sentTx.mined?.timestamp,
          status: 'MINED',
        },
        {
          timestamp: sentTx.sentTimestamp,
          status: 'SENT',
        },
      ])
    })
    it('should return correct history for sentTransaction that was mined and reverted', () => {
      const sentTx = sentTransaction({ mined: true, reverted: true })
      const history = buildRegularTransactionHistory({
        sentTransaction: sentTx,
      })
      expect(history).toEqual([
        {
          timestamp: sentTx.mined?.timestamp,
          status: 'REVERTED',
        },
        {
          timestamp: sentTx.sentTimestamp,
          status: 'SENT',
        },
      ])
    })
  })
  describe('userTransaction', () => {
    it('should return correct history for userTransaction', () => {
      const userTx = userTransaction()
      const history = buildRegularTransactionHistory({
        userTransaction: userTx,
      })
      expect(history).toEqual([
        {
          timestamp: userTx.timestamp,
          status: 'MINED',
        },
        {
          timestamp: undefined,
          status: 'SENT',
        },
      ])
    })
  })
  describe('forcedTradeOffer', () => {
    it('should return correct history for forcedTradeOffer', () => {
      const offer = forcedTradeOffer({ accepted: true, sent: true })

      const history = buildRegularTransactionHistory({
        forcedTradeOffer: offer,
      })

      expect(history).toEqual([
        {
          timestamp: undefined,
          status: 'SENT',
        },
      ])
    })
  })
})

const sentTransaction = (opts?: {
  mined: boolean
  reverted?: boolean
}): SentTransactionRecord => ({
  transactionHash: Hash256.fake(),
  starkKey: StarkKey.fake(),
  vaultOrPositionId: BigInt(0),
  // @ts-expect-error
  data: {} as SentTransactionRecord,
  sentTimestamp: Timestamp(10),
  mined: opts?.mined
    ? {
        timestamp: Timestamp(20),
        blockNumber: 0,
        reverted: Boolean(opts.reverted),
      }
    : undefined,
})

const userTransaction = (opts?: {
  included: boolean
}): UserTransactionRecord => ({
  id: 0,
  transactionHash: Hash256.fake(),
  starkKeyA: StarkKey.fake(),
  // @ts-expect-error
  data: {} as UserTransactionRecord,
  timestamp: Timestamp(10),
  included: opts?.included
    ? {
        timestamp: Timestamp(20),
        blockNumber: 0,
        stateUpdateId: 1,
      }
    : undefined,
})

const forcedTradeOffer = (opts?: {
  accepted?: boolean
  sent?: boolean
  cancelled?: boolean
  expired?: boolean
}): ForcedTradeOfferRecord => ({
  id: 0,
  createdAt: Timestamp(10),
  starkKeyA: StarkKey.fake(),
  positionIdA: BigInt(0),
  syntheticAssetId: AssetId('USDC-9'),
  collateralAmount: BigInt(0),
  syntheticAmount: BigInt(0),
  isABuyingSynthetic: true,
  // @ts-expect-error
  accepted: opts?.accepted
    ? {
        at: Timestamp(20),
        transactionHash: opts.sent ? Hash256.fake() : undefined,
        submissionExpirationTime: opts.expired
          ? Timestamp(Date.now() - 1000 * 60 * 60 * 24)
          : Timestamp(Date.now() + 1000 * 60 * 60 * 24),
      }
    : undefined,
  cancelledAt: opts?.cancelled ? Timestamp(20) : undefined,
})
