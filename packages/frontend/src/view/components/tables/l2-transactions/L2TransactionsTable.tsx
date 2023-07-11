import { assertUnreachable, PageContext } from '@explorer/shared'
import React from 'react'

import { PerpetualL2TransactionEntry } from '../../../pages/l2-transaction/common'
import { PerpetualL2TransactionsTable } from './perpetual/PerpetualL2TransactionsTable'

export interface L2TransactionsTableProps {
  context: PageContext
  transactions: PerpetualL2TransactionEntry[]
}

export function L2TransactionsTable({
  context,
  transactions,
}: L2TransactionsTableProps) {
  switch (context.tradingMode) {
    case 'perpetual':
      return (
        <PerpetualL2TransactionsTable
          transactions={transactions}
          collateralAsset={context.collateralAsset}
        />
      )
    case 'spot':
      throw new Error('Not implemented')
    default:
      assertUnreachable(context)
  }
}
