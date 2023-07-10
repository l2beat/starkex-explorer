import { PerpetualL2TransactionData } from '@explorer/shared'

type PreprocessedL2TransactionsStatisticsKeys = `${Uncapitalize<
  PerpetualL2TransactionData['type']
>}Count`

export type PreprocessedL2TransactionsStatistics = {
  [key in PreprocessedL2TransactionsStatisticsKeys]: number
} & {
  replacedTransactionsCount: number
}

// We do not need PreprocessedL2TransactionsCountsJSON type because all the fields are numbers

export function sumPreprocessedL2TransactionsStatistics(
  a: PreprocessedL2TransactionsStatistics,
  b: PreprocessedL2TransactionsStatistics
): PreprocessedL2TransactionsStatistics {
  const res = [a, b].reduce<PreprocessedL2TransactionsStatistics>(
    (result, obj) => {
      for (const k in obj) {
        result[k as keyof PreprocessedL2TransactionsStatistics] =
          (result[k as keyof PreprocessedL2TransactionsStatistics] || 0) +
          obj[k as keyof PreprocessedL2TransactionsStatistics]
      }
      return result
    },
    {} as PreprocessedL2TransactionsStatistics
  )
  return res
}
