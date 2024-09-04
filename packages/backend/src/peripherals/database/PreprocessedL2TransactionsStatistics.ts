import { PerpetualL2TransactionData } from '@explorer/shared'

import { L2TransactionTypesToExclude } from '../../config/starkex/StarkexConfig'
import { uncapitalize } from '../../utils/uncapitalize'

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
    | undefined,
  excludeL2TransactionTypes: L2TransactionTypesToExclude = []
) {
  if (!statistics) return 0

  const multiTransactionCount = isPreprocessedL2TransactionsStatistics(
    statistics
  )
    ? statistics.multiTransactionCount
    : 0

  let initialValue =
    multiTransactionCount + statistics.replacedTransactionsCount

  for (const type of excludeL2TransactionTypes) {
    initialValue += statistics[`${uncapitalize(type)}Count`]
  }

  return Object.values(statistics).reduce(
    (sum, value) => sum + value,
    -initialValue
  )
}

function isPreprocessedL2TransactionsStatistics(
  statistics:
    | PreprocessedL2TransactionsStatistics
    | PreprocessedUserL2TransactionsStatistics
): statistics is PreprocessedL2TransactionsStatistics {
  return 'multiTransactionCount' in statistics
}
