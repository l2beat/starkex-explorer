import { Hash256, Timestamp } from '@explorer/types'
import { expect, mockFn } from 'earl'

import {
  fakeAccepted,
  fakeIncluded,
  fakeInitialOffer,
  fakeMined,
  fakeOffer,
  fakeSentTransaction,
  fakeTimestamp,
  fakeUserTransaction,
} from '../test/fakes'
import {
  TransactionHistory,
  TransactionHistoryItem,
} from './TransactionHistory'

describe(TransactionHistory.name, () => {
  it('throws error when no transactions are provided', () => {
    expect(() => new TransactionHistory({})).toThrow(
      'TransactionHistory cannot be initialized without at least one transaction'
    )
  })

  describe(
    TransactionHistory.prototype.getRegularTransactionHistory.name,
    () => {
      describe('forcedTradeOffer ✔ | sentTransaction X | userTransaction X', () => {
        it('returns empty array if transaction hash is not present', () => {
          const forcedTradeOffer = fakeOffer()
          const transactionHistory = new TransactionHistory({
            forcedTradeOffer,
          })

          expect(transactionHistory.getRegularTransactionHistory()).toEqual([])
        })

        it('returns [SENT] without timestamp if transaction hash is present', () => {
          const forcedTradeOffer = fakeOffer({
            accepted: fakeAccepted({ transactionHash: Hash256.fake() }),
          })
          const transactionHistory = new TransactionHistory({
            forcedTradeOffer,
          })

          expect(transactionHistory.getRegularTransactionHistory()).toEqual([
            { status: 'SENT', timestamp: undefined },
          ])
        })
      })
      describe('forcedTradeOffer ✔ | sentTransaction ✔ | userTransaction X', () => {
        it('returns [SENT] with timestamp', () => {
          const forcedTradeOffer = fakeOffer()
          const sentTransaction = fakeSentTransaction()

          const transactionHistory = new TransactionHistory({
            forcedTradeOffer,
            sentTransaction,
          })

          expect(transactionHistory.getRegularTransactionHistory()).toEqual([
            { status: 'SENT', timestamp: sentTransaction.sentTimestamp },
          ])
        })
        it('returns [MINED, SENT] with timestamp if mined is present', () => {
          const forcedTradeOffer = fakeOffer()
          const sentTransaction = fakeSentTransaction({ mined: fakeMined() })

          const transactionHistory = new TransactionHistory({
            forcedTradeOffer,
            sentTransaction,
          })

          expect(transactionHistory.getRegularTransactionHistory()).toEqual([
            { status: 'MINED', timestamp: sentTransaction.mined?.timestamp },
            { status: 'SENT', timestamp: sentTransaction.sentTimestamp },
          ])
        })
        it('returns [REVERTED, SENT] with timestamp if mined is present and mined.reverted is true', () => {
          const forcedTradeOffer = fakeOffer()
          const sentTransaction = fakeSentTransaction({
            mined: fakeMined({ reverted: true }),
          })

          const transactionHistory = new TransactionHistory({
            forcedTradeOffer,
            sentTransaction,
          })

          expect(transactionHistory.getRegularTransactionHistory()).toEqual([
            { status: 'REVERTED', timestamp: sentTransaction.mined?.timestamp },
            { status: 'SENT', timestamp: sentTransaction.sentTimestamp },
          ])
        })
      })
      describe('forcedTradeOffer X | sentTransaction ✔ | userTransaction X', () => {
        it('returns [SENT] with timestamp', () => {
          const sentTransaction = fakeSentTransaction()

          const transactionHistory = new TransactionHistory({
            sentTransaction,
          })

          expect(transactionHistory.getRegularTransactionHistory()).toEqual([
            { status: 'SENT', timestamp: sentTransaction.sentTimestamp },
          ])
        })
        it('returns [MINED, SENT] with timestamp if mined is present', () => {
          const sentTransaction = fakeSentTransaction({ mined: fakeMined() })

          const transactionHistory = new TransactionHistory({
            sentTransaction,
          })

          expect(transactionHistory.getRegularTransactionHistory()).toEqual([
            { status: 'MINED', timestamp: sentTransaction.mined?.timestamp },
            { status: 'SENT', timestamp: sentTransaction.sentTimestamp },
          ])
        })
        it('returns [REVERTED, SENT] with timestamp if mined is present and mined.reverted is true', () => {
          const sentTransaction = fakeSentTransaction({
            mined: fakeMined({ reverted: true }),
          })

          const transactionHistory = new TransactionHistory({
            sentTransaction,
          })

          expect(transactionHistory.getRegularTransactionHistory()).toEqual([
            { status: 'REVERTED', timestamp: sentTransaction.mined?.timestamp },
            { status: 'SENT', timestamp: sentTransaction.sentTimestamp },
          ])
        })
      })
      describe('forcedTradeOffer ✔ | sentTransaction X | userTransaction ✔', () => {
        it('returns [MINED, SENT] with undefined sent timestamp', () => {
          const forcedTradeOffer = fakeOffer()
          const userTransaction = fakeUserTransaction()

          const transactionHistory = new TransactionHistory({
            forcedTradeOffer,
            userTransaction,
          })

          expect(transactionHistory.getRegularTransactionHistory()).toEqual([
            { status: 'MINED', timestamp: userTransaction.timestamp },
            { status: 'SENT', timestamp: undefined },
          ])
        })
      })
      describe('forcedTradeOffer X | sentTransaction X | userTransaction ✔', () => {
        it('returns [MINED, SENT] with undefined sent timestamp', () => {
          const userTransaction = fakeUserTransaction()

          const transactionHistory = new TransactionHistory({
            userTransaction,
          })

          expect(transactionHistory.getRegularTransactionHistory()).toEqual([
            { status: 'MINED', timestamp: userTransaction.timestamp },
            { status: 'SENT', timestamp: undefined },
          ])
        })
      })
      describe('forcedTradeOffer X | sentTransaction ✔ | userTransaction ✔ ', () => {
        it('returns [MINED, SENT]', () => {
          const sentTransaction = fakeSentTransaction()
          const userTransaction = fakeUserTransaction()

          const transactionHistory = new TransactionHistory({
            sentTransaction,
            userTransaction,
          })

          expect(transactionHistory.getRegularTransactionHistory()).toEqual([
            { status: 'MINED', timestamp: userTransaction.timestamp },
            { status: 'SENT', timestamp: sentTransaction.sentTimestamp },
          ])
        })
      })
      describe('forcedTradeOffer ✔ | sentTransaction ✔ | userTransaction ✔', () => {
        it('returns [MINED, SENT]', () => {
          const forcedTradeOffer = fakeOffer()
          const sentTransaction = fakeSentTransaction()
          const userTransaction = fakeUserTransaction()

          const transactionHistory = new TransactionHistory({
            forcedTradeOffer,
            sentTransaction,
            userTransaction,
          })

          expect(transactionHistory.getRegularTransactionHistory()).toEqual([
            { status: 'MINED', timestamp: userTransaction.timestamp },
            { status: 'SENT', timestamp: sentTransaction.sentTimestamp },
          ])
        })
      })
    }
  )

  describe(
    TransactionHistory.prototype.getForcedTransactionHistory.name,
    () => {
      const sentTransaction = fakeSentTransaction({ mined: fakeMined() })
      const previousRegularTransactionHistoryResults: TransactionHistoryItem<
        'SENT' | 'REVERTED' | 'MINED'
      >[] = [
        {
          status: 'MINED',
          timestamp: sentTransaction.mined?.timestamp,
        },
        { status: 'SENT', timestamp: sentTransaction.sentTimestamp },
      ]

      it(`returns results from ${TransactionHistory.prototype.getRegularTransactionHistory.name} if userTransaction is not included`, () => {
        const forcedTradeOffer = fakeOffer()
        const sentTransaction = fakeSentTransaction()
        const userTransaction = fakeUserTransaction()
        const transactionHistory = new TransactionHistory({
          forcedTradeOffer,
          sentTransaction,
          userTransaction,
        })

        transactionHistory.getRegularTransactionHistory = mockFn(
          (): TransactionHistoryItem<'SENT' | 'REVERTED' | 'MINED'>[] =>
            previousRegularTransactionHistoryResults
        )

        expect(transactionHistory.getForcedTransactionHistory()).toEqual(
          previousRegularTransactionHistoryResults
        )
      })

      it(`returns [INCLUDED, ...previousRegularTransactionHistoryResults] if userTransaction is included`, () => {
        const forcedTradeOffer = fakeOffer()
        const sentTransaction = fakeSentTransaction()
        const userTransaction = fakeUserTransaction({
          included: fakeIncluded(),
        })

        const transactionHistory = new TransactionHistory({
          forcedTradeOffer,
          sentTransaction,
          userTransaction,
        })

        transactionHistory.getRegularTransactionHistory = mockFn(
          (): TransactionHistoryItem<'SENT' | 'REVERTED' | 'MINED'>[] =>
            previousRegularTransactionHistoryResults
        )

        expect(transactionHistory.getForcedTransactionHistory()).toEqual([
          {
            status: 'INCLUDED',
            timestamp: userTransaction.included?.timestamp,
          },
          ...previousRegularTransactionHistoryResults,
        ])
      })
    }
  )

  describe(
    TransactionHistory.prototype.getForcedTradeTransactionHistory.name,
    () => {
      const sentTransaction = fakeSentTransaction({ mined: fakeMined() })
      const userTransaction = fakeUserTransaction({ included: fakeIncluded() })
      const previousForcedTransactionHistoryResults: TransactionHistoryItem<
        'SENT' | 'REVERTED' | 'MINED' | 'INCLUDED'
      >[] = [
        { status: 'INCLUDED', timestamp: userTransaction.included?.timestamp },
        {
          status: 'MINED',
          timestamp: sentTransaction.mined?.timestamp,
        },
        { status: 'SENT', timestamp: sentTransaction.sentTimestamp },
      ]
      // Basically for the next two describes we want to test all possible combinations of sentTransaction and userTransaction.
      // Even though they do not make any difference as only the forced trade offer matters.
      // To prevent code duplication we use the following array of tuples.
      const additionalTransactionConfiguration = [
        [],
        [fakeSentTransaction()],
        [undefined, fakeUserTransaction()],
        [fakeSentTransaction(), fakeUserTransaction()],
      ] as const

      additionalTransactionConfiguration.forEach(
        ([sentTransaction, userTransaction]) => {
          const describeTitle = `forcedTradeOffer ✔ | sentTransaction ${
            sentTransaction ? '✔' : 'X'
          } | userTransaction ${userTransaction ? '✔' : 'X'}`
          describe(describeTitle, () => {
            it('returns [...previousForcedTransactionHistoryResults, CREATED]', () => {
              const forcedTradeOffer = fakeInitialOffer()

              const transactionHistory = new TransactionHistory({
                forcedTradeOffer,
              })

              transactionHistory.getForcedTransactionHistory = mockFn(
                (): TransactionHistoryItem<
                  'SENT' | 'REVERTED' | 'MINED' | 'INCLUDED'
                >[] => previousForcedTransactionHistoryResults
              )

              expect(
                transactionHistory.getForcedTradeTransactionHistory()
              ).toEqual([
                ...previousForcedTransactionHistoryResults,
                { status: 'CREATED', timestamp: forcedTradeOffer.createdAt },
              ])
            })

            it('returns [...previousForcedTransactionHistoryResults, ACCEPTED, CREATED] if offer got accepted', () => {
              const forcedTradeOffer = fakeOffer()

              const transactionHistory = new TransactionHistory({
                forcedTradeOffer,
              })

              transactionHistory.getForcedTransactionHistory = mockFn(
                (): TransactionHistoryItem<
                  'SENT' | 'REVERTED' | 'MINED' | 'INCLUDED'
                >[] => previousForcedTransactionHistoryResults
              )

              expect(
                transactionHistory.getForcedTradeTransactionHistory()
              ).toEqual([
                ...previousForcedTransactionHistoryResults,
                {
                  status: 'ACCEPTED',
                  timestamp: forcedTradeOffer.accepted?.at,
                },
                { status: 'CREATED', timestamp: forcedTradeOffer.createdAt },
              ])
            })

            it('returns [...previousForcedTransactionHistoryResults, ACCEPTED, CREATED] if offer got accepted, expired (submissionExpirationTime is in past) but got sent', () => {
              const forcedTradeOffer = fakeOffer({
                accepted: fakeAccepted({
                  submissionExpirationTime: Timestamp(
                    new Date().getTime() - 60 * 1000
                  ),
                  transactionHash: Hash256.fake(),
                }),
              })

              const transactionHistory = new TransactionHistory({
                forcedTradeOffer,
              })

              transactionHistory.getForcedTransactionHistory = mockFn(
                (): TransactionHistoryItem<
                  'SENT' | 'REVERTED' | 'MINED' | 'INCLUDED'
                >[] => previousForcedTransactionHistoryResults
              )

              expect(
                transactionHistory.getForcedTradeTransactionHistory()
              ).toEqual([
                ...previousForcedTransactionHistoryResults,
                {
                  status: 'ACCEPTED',
                  timestamp: forcedTradeOffer.accepted?.at,
                },
                { status: 'CREATED', timestamp: forcedTradeOffer.createdAt },
              ])
            })

            it('returns [...previousForcedTransactionHistoryResults, EXPIRED, ACCEPTED, CREATED] if offer got accepted and expired', () => {
              const forcedTradeOffer = fakeOffer({
                accepted: fakeAccepted({
                  submissionExpirationTime: Timestamp(
                    new Date().getTime() - 60 * 1000
                  ),
                }),
              })

              const transactionHistory = new TransactionHistory({
                forcedTradeOffer,
              })

              transactionHistory.getForcedTransactionHistory = mockFn(
                (): TransactionHistoryItem<
                  'SENT' | 'REVERTED' | 'MINED' | 'INCLUDED'
                >[] => previousForcedTransactionHistoryResults
              )

              expect(
                transactionHistory.getForcedTradeTransactionHistory()
              ).toEqual([
                ...previousForcedTransactionHistoryResults,
                {
                  status: 'EXPIRED',
                  timestamp:
                    forcedTradeOffer.accepted?.submissionExpirationTime,
                },
                {
                  status: 'ACCEPTED',
                  timestamp: forcedTradeOffer.accepted?.at,
                },
                { status: 'CREATED', timestamp: forcedTradeOffer.createdAt },
              ])
            })

            it('returns [...previousForcedTransactionHistoryResults, CANCELLED, ACCEPTED, CREATED] if offer got accepted and then cancelled', () => {
              const forcedTradeOffer = fakeOffer({
                cancelledAt: fakeTimestamp(),
                accepted: fakeAccepted(),
              })

              const transactionHistory = new TransactionHistory({
                forcedTradeOffer,
              })

              transactionHistory.getForcedTransactionHistory = mockFn(
                (): TransactionHistoryItem<
                  'SENT' | 'REVERTED' | 'MINED' | 'INCLUDED'
                >[] => previousForcedTransactionHistoryResults
              )

              expect(
                transactionHistory.getForcedTradeTransactionHistory()
              ).toEqual([
                ...previousForcedTransactionHistoryResults,
                {
                  status: 'CANCELLED',
                  timestamp: forcedTradeOffer.cancelledAt,
                },
                {
                  status: 'ACCEPTED',
                  timestamp: forcedTradeOffer.accepted?.at,
                },
                { status: 'CREATED', timestamp: forcedTradeOffer.createdAt },
              ])
            })

            it('returns [...previousForcedTransactionHistoryResults, CANCELLED, CREATED] if offer got created and then cancelled', () => {
              const forcedTradeOffer = fakeOffer({
                cancelledAt: fakeTimestamp(),
                accepted: undefined,
              })

              const transactionHistory = new TransactionHistory({
                forcedTradeOffer,
              })

              transactionHistory.getForcedTransactionHistory = mockFn(
                (): TransactionHistoryItem<
                  'SENT' | 'REVERTED' | 'MINED' | 'INCLUDED'
                >[] => previousForcedTransactionHistoryResults
              )

              expect(
                transactionHistory.getForcedTradeTransactionHistory()
              ).toEqual([
                ...previousForcedTransactionHistoryResults,
                {
                  status: 'CANCELLED',
                  timestamp: forcedTradeOffer.cancelledAt,
                },
                { status: 'CREATED', timestamp: forcedTradeOffer.createdAt },
              ])
            })
          })
        }
      )
      // We do not need the first element of the array, because there is no way to have all three transactions undefined
      additionalTransactionConfiguration
        .slice(1)
        .forEach(([sentTransaction, userTransaction]) => {
          const describeTitle = `forcedTradeOffer X | sentTransaction ${
            sentTransaction ? '✔' : 'X'
          } | userTransaction ${userTransaction ? '✔' : 'X'}`
          describe(describeTitle, () => {
            it('returns [...previousForcedTransactionHistoryResults, ACCEPTED, CREATED] without timestamps', () => {
              const transactionHistory = new TransactionHistory({
                userTransaction,
                sentTransaction,
              })

              transactionHistory.getForcedTransactionHistory = mockFn(
                (): TransactionHistoryItem<
                  'SENT' | 'REVERTED' | 'MINED' | 'INCLUDED'
                >[] => previousForcedTransactionHistoryResults
              )

              expect(
                transactionHistory.getForcedTradeTransactionHistory()
              ).toEqual([
                ...previousForcedTransactionHistoryResults,
                { status: 'ACCEPTED', timestamp: undefined },
                { status: 'CREATED', timestamp: undefined },
              ])
            })
          })
        })
    }
  )

  describe(
    TransactionHistory.prototype.getLatestRegularTransactionStatus.name,
    () => {
      it('should throw an error if there is no regular transaction history', () => {
        const transactionHistory = new TransactionHistory({
          userTransaction: fakeUserTransaction(),
          sentTransaction: fakeSentTransaction(),
        })
        transactionHistory.getRegularTransactionHistory = mockFn(() => [])

        expect(() =>
          transactionHistory.getLatestRegularTransactionStatus()
        ).toThrow(Error, 'Transaction history is empty')
      })

      it('returns the latest status of regular transaction', () => {
        const regularTransactionHistory: TransactionHistoryItem<'SENT'>[] = [
          {
            status: 'SENT',
            timestamp: fakeTimestamp(),
          },
        ]
        const transactionHistory = new TransactionHistory({
          userTransaction: fakeUserTransaction(),
          sentTransaction: fakeSentTransaction(),
        })
        transactionHistory.getRegularTransactionHistory = mockFn(
          () => regularTransactionHistory
        )

        expect(
          transactionHistory.getLatestForcedTradeTransactionStatus()
        ).toEqual(regularTransactionHistory.at(0)!.status)
      })
    }
  )

  describe(
    TransactionHistory.prototype.getLatestForcedTransactionStatus.name,
    () => {
      it('should throw an error if there is no forced transaction history', () => {
        const transactionHistory = new TransactionHistory({
          userTransaction: fakeUserTransaction(),
          sentTransaction: fakeSentTransaction(),
        })
        transactionHistory.getForcedTransactionHistory = mockFn(() => [])

        expect(() =>
          transactionHistory.getLatestForcedTransactionStatus()
        ).toThrow(Error, 'Transaction history is empty')
      })

      it('returns the latest status of forced transaction', () => {
        const forcedTransactionHistoryResults: TransactionHistoryItem<'INCLUDED'>[] =
          [
            {
              status: 'INCLUDED',
              timestamp: fakeTimestamp(),
            },
          ]
        const transactionHistory = new TransactionHistory({
          userTransaction: fakeUserTransaction(),
          sentTransaction: fakeSentTransaction(),
        })
        transactionHistory.getForcedTransactionHistory = mockFn(
          () => forcedTransactionHistoryResults
        )

        expect(transactionHistory.getLatestForcedTransactionStatus()).toEqual(
          forcedTransactionHistoryResults.at(0)!.status
        )
      })
    }
  )

  describe(
    TransactionHistory.prototype.getLatestForcedTradeTransactionStatus.name,
    () => {
      it('should throw an error if there is no forced trade transaction history', () => {
        const transactionHistory = new TransactionHistory({
          userTransaction: fakeUserTransaction(),
          sentTransaction: fakeSentTransaction(),
        })
        transactionHistory.getForcedTradeTransactionHistory = mockFn(() => [])

        expect(() =>
          transactionHistory.getLatestForcedTradeTransactionStatus()
        ).toThrow(Error, 'Transaction history is empty')
      })

      it('returns the latest status of forced trade transaction', () => {
        const forcedTradeTransactionHistory: TransactionHistoryItem[] = [
          {
            status: 'ACCEPTED',
            timestamp: fakeTimestamp(),
          },
        ]
        const transactionHistory = new TransactionHistory({
          userTransaction: fakeUserTransaction(),
          sentTransaction: fakeSentTransaction(),
        })
        transactionHistory.getForcedTradeTransactionHistory = mockFn(
          () => forcedTradeTransactionHistory
        )

        expect(
          transactionHistory.getLatestForcedTradeTransactionStatus()
        ).toEqual(forcedTradeTransactionHistory.at(0)!.status)
      })
    }
  )
})
