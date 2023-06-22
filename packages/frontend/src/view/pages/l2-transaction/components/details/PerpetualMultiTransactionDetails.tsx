import { CollateralAsset, PerpetualL2TransactionData } from '@explorer/shared'
import React from 'react'

import { Card } from '../../../../components/Card'
import { TransactionField } from '../../../transaction/components/TransactionField'
import { CurrentStatusField } from '../CurrentStatusField'
import { L2TransactionsList } from '../L2TransactionsList'

export interface PerpetualMultiTransactionDetailsProps {
  transactionId: number
  stateUpdateId: number | undefined
  data: Extract<PerpetualL2TransactionData, { type: 'MultiTransaction' }>
  collateralAsset: CollateralAsset
  altIndex: number | undefined
}

export function PerpetualMultiTransactionDetails(
  props: PerpetualMultiTransactionDetailsProps
) {
  return (
    <Card className="flex flex-col gap-6">
      <TransactionField label="Current status">
        <CurrentStatusField stateUpdateId={props.stateUpdateId} />
      </TransactionField>
      <TransactionField label="Transactions">
        <L2TransactionsList
          transactions={props.data.transactions}
          contentState="multi"
          collateralAsset={props.collateralAsset}
          transactionId={props.transactionId}
          altIndex={props.altIndex}
        />
      </TransactionField>
    </Card>
  )
}
