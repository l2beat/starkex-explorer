import { expect } from 'earl'

import { fakePreprocessedL2TransactionsStatistics } from '../test/fakes'
import { sumNumericValuesByKey } from './sumNumericValuesByKey'

describe(sumNumericValuesByKey.name, () => {
  it('sums', () => {
    const firstStatistics = fakePreprocessedL2TransactionsStatistics()
    const secondStatistics = fakePreprocessedL2TransactionsStatistics()
    const thirdStatistics = fakePreprocessedL2TransactionsStatistics()

    const result = sumNumericValuesByKey(
      firstStatistics,
      secondStatistics,
      thirdStatistics
    )

    expect(result).toEqual({
      depositCount:
        firstStatistics.depositCount +
        secondStatistics.depositCount +
        thirdStatistics.depositCount,
      withdrawalToAddressCount:
        firstStatistics.withdrawalToAddressCount +
        secondStatistics.withdrawalToAddressCount +
        thirdStatistics.withdrawalToAddressCount,
      forcedWithdrawalCount:
        firstStatistics.forcedWithdrawalCount +
        secondStatistics.forcedWithdrawalCount +
        thirdStatistics.forcedWithdrawalCount,
      tradeCount:
        firstStatistics.tradeCount +
        secondStatistics.tradeCount +
        thirdStatistics.tradeCount,
      forcedTradeCount:
        firstStatistics.forcedTradeCount +
        secondStatistics.forcedTradeCount +
        thirdStatistics.forcedTradeCount,
      transferCount:
        firstStatistics.transferCount +
        secondStatistics.transferCount +
        thirdStatistics.transferCount,
      conditionalTransferCount:
        firstStatistics.conditionalTransferCount +
        secondStatistics.conditionalTransferCount +
        thirdStatistics.conditionalTransferCount,
      liquidateCount:
        firstStatistics.liquidateCount +
        secondStatistics.liquidateCount +
        thirdStatistics.liquidateCount,
      deleverageCount:
        firstStatistics.deleverageCount +
        secondStatistics.deleverageCount +
        thirdStatistics.deleverageCount,
      fundingTickCount:
        firstStatistics.fundingTickCount +
        secondStatistics.fundingTickCount +
        thirdStatistics.fundingTickCount,
      oraclePricesTickCount:
        firstStatistics.oraclePricesTickCount +
        secondStatistics.oraclePricesTickCount +
        thirdStatistics.oraclePricesTickCount,
      multiTransactionCount:
        firstStatistics.multiTransactionCount +
        secondStatistics.multiTransactionCount +
        thirdStatistics.multiTransactionCount,
      replacedTransactionsCount:
        firstStatistics.replacedTransactionsCount +
        secondStatistics.replacedTransactionsCount +
        thirdStatistics.replacedTransactionsCount,
    })
  })
})
