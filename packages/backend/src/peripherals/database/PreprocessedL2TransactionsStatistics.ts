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
