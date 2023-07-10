import { expect } from 'earl'
import { fakePreprocessedL2TransactionsStatistics } from '../../test/fakes'
import { sumPreprocessedL2TransactionsStatistics } from './PreprocessedL2TransactionsStatistics'

describe(sumPreprocessedL2TransactionsStatistics.name, () => {
  it('sums', () => {
    const firstStatistics = fakePreprocessedL2TransactionsStatistics()
    const secondStatistics = fakePreprocessedL2TransactionsStatistics()

    const result = sumPreprocessedL2TransactionsStatistics(
      firstStatistics,
      secondStatistics
    )

    expect(result).toEqual({
      depositCount:
        firstStatistics.depositCount + secondStatistics.depositCount,
      withdrawalToAddressCount:
        firstStatistics.withdrawalToAddressCount +
        secondStatistics.withdrawalToAddressCount,
      forcedWithdrawalCount:
        firstStatistics.forcedWithdrawalCount +
        secondStatistics.forcedWithdrawalCount,
      tradeCount: firstStatistics.tradeCount + secondStatistics.tradeCount,
      forcedTradeCount:
        firstStatistics.forcedTradeCount + secondStatistics.forcedTradeCount,
      transferCount:
        firstStatistics.transferCount + secondStatistics.transferCount,
      conditionalTransferCount:
        firstStatistics.conditionalTransferCount +
        secondStatistics.conditionalTransferCount,
      liquidateCount:
        firstStatistics.liquidateCount + secondStatistics.liquidateCount,
      deleverageCount:
        firstStatistics.deleverageCount + secondStatistics.deleverageCount,
      fundingTickCount:
        firstStatistics.fundingTickCount + secondStatistics.fundingTickCount,
      oraclePricesTickCount:
        firstStatistics.oraclePricesTickCount +
        secondStatistics.oraclePricesTickCount,
      multiTransactionCount:
        firstStatistics.multiTransactionCount +
        secondStatistics.multiTransactionCount,
      replacedTransactionsCount:
        firstStatistics.replacedTransactionsCount +
        secondStatistics.replacedTransactionsCount,
    })
  })
})
