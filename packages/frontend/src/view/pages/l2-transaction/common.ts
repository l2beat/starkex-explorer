import { assertUnreachable } from '@explorer/shared'

import { StatusType } from '../../components/StatusBadge'
import { L2TransactionEntry } from '../../components/tables/L2TransactionsTable'

export function l2TransactionTypeToText(
  type: L2TransactionEntry['data']['type']
): string {
  switch (type) {
    case 'Deposit':
    case 'Trade':
    case 'Transfer':
    case 'Liquidate':
    case 'Deleverage':
      return type
    case 'ConditionalTransfer':
      return 'Conditional transfer'
    case 'WithdrawToAddress':
      return 'Withdraw to address'
    case 'ForcedWithdrawal':
      return 'Forced withdrawal'
    case 'ForcedTrade':
      return 'Forced trade'
    case 'FundingTick':
      return 'Funding tick'
    case 'OraclePricesTick':
      return 'Oracle prices tick'
    case 'MultiTransaction':
      return 'Multi transaction'
    default:
      assertUnreachable(type)
  }
}

export function getL2StatusBadgeValues(stateUpdateId: number | undefined): {
  type: StatusType
  text: string
} {
  return stateUpdateId !== undefined
    ? { type: 'END', text: 'Included (2/2)' }
    : { type: 'BEGIN', text: 'Created (1/2)' }
}
