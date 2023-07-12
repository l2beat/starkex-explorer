import { expect } from 'earl'
import { it } from 'mocha'

import { sumUpTransactionCount } from './PreprocessedL2TransactionsStatistics'

describe.only(sumUpTransactionCount.name, () => {
  it('returns 0 when statistics is undefined', () => {
    const result = sumUpTransactionCount(undefined)

    expect(result).toEqual(0)
  })

  it('sums up all the values for PreprocessedL2TransactionsStatistics', () => {
    const result = sumUpTransactionCount({
      depositCount: 1,
      withdrawalToAddressCount: 2,
      forcedWithdrawalCount: 3,
      tradeCount: 4,
      forcedTradeCount: 5,
      transferCount: 6,
      conditionalTransferCount: 7,
      liquidateCount: 8,
      deleverageCount: 9,
      fundingTickCount: 10,
      oraclePricesTickCount: 11,
      multiTransactionCount: 12,
      replacedTransactionsCount: 13,
    })

    expect(result).toEqual(66)
  })

  it('sums up all the values for PreprocessedUserL2TransactionsStatistics', () => {
    const result = sumUpTransactionCount({
      depositCount: 1,
      withdrawalToAddressCount: 2,
      forcedWithdrawalCount: 3,
      tradeCount: 4,
      forcedTradeCount: 5,
      transferCount: 6,
      conditionalTransferCount: 7,
      liquidateCount: 8,
      deleverageCount: 9,
      fundingTickCount: 10,
      oraclePricesTickCount: 11,
      replacedTransactionsCount: 13,
    })

    expect(result).toEqual(66)
  })
})
