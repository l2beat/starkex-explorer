import { PerpetualL2TransactionData } from '@explorer/shared'

type PreprocessedL2TransactionsStatisticsKeys = `${Uncapitalize<
  PerpetualL2TransactionData['type']
>}Count`

export type PreprocessedL2TransactionsStatistics = {
  [key in PreprocessedL2TransactionsStatisticsKeys]: number
} & {
  replacedTransactionsCount: number
}

export type PreprocessedUserL2TransactionsStatistics = Omit<
  PreprocessedL2TransactionsStatistics,
  'multiTransactionCount'
>
// We do not need PreprocessedL2TransactionsCountsJSON type because all the fields are numbers

export function sumUpTransactionCount(
  statistics:
    | PreprocessedL2TransactionsStatistics
    | PreprocessedUserL2TransactionsStatistics
    | undefined
) {
  if (!statistics) return 0

  const multiTransactionCount = isPreprocessedL2TransactionsStatistics(
    statistics
  )
    ? statistics.multiTransactionCount
    : 0

  const replacedAndMultiTransactionCount =
    multiTransactionCount + statistics.replacedTransactionsCount

  return Object.values(statistics).reduce(
    (sum, value) => sum + value,
    -replacedAndMultiTransactionCount
  )
}

function isPreprocessedL2TransactionsStatistics(
  statistics:
    | PreprocessedL2TransactionsStatistics
    | PreprocessedUserL2TransactionsStatistics
): statistics is PreprocessedL2TransactionsStatistics {
  return 'multiTransactionCount' in statistics
}
