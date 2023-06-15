import { CollateralAsset, PerpetualL2TransactionData } from '@explorer/shared'
import React from 'react'

import { L2MultiOrAlternativeTransactionsTable } from '../../../../components/tables/l2-transactions/L2MultiOrAlternativeTransactionsTable'

export interface PerpetualMultiTransactionDetailsProps {
  transactionId: number
  data: Extract<PerpetualL2TransactionData, { type: 'MultiTransaction' }>
  collateralAsset: CollateralAsset
  altIndex: number | undefined
}

export function PerpetualMultiTransactionDetails(
  props: PerpetualMultiTransactionDetailsProps
) {
  return (
    <L2MultiOrAlternativeTransactionsTable
      transactions={props.data.transactions}
      contentState="multi"
      collateralAsset={props.collateralAsset}
      transactionId={props.transactionId}
      altIndex={props.altIndex}
    />
  )
}
