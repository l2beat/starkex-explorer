import {
  assertUnreachable,
  CollateralAsset,
  PerpetualL2TransactionData,
} from '@explorer/shared'

import console from 'console'
import { StatusType } from '../../components/StatusBadge'

export interface PerpetualTransactionDetailsProps<
  T extends PerpetualL2TransactionData['type']
> {
  stateUpdateId: number | undefined
  data: Extract<PerpetualL2TransactionData, { type: T }>
  collateralAsset: CollateralAsset
}

export interface PerpetualL2TransactionEntry<
  T extends PerpetualL2TransactionData['type'] = PerpetualL2TransactionData['type']
> {
  transactionId: number
  data: Extract<PerpetualL2TransactionData, { type: T }>
  stateUpdateId: number | undefined
  isPartOfMulti: boolean
  state?: 'alternative' | 'replaced'
}

export function perpetualL2TransactionTypeToText(
  type: PerpetualL2TransactionData['type']
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

export function getL2TransactionStatusBadgeValues(
  stateUpdateId: number | undefined
): {
  type: StatusType
  text: string
} {
  return stateUpdateId !== undefined
    ? { type: 'END', text: 'Included (2/2)' }
    : { type: 'BEGIN', text: 'Created (1/2)' }
}
