import { CollateralAsset, PerpetualL2TransactionData } from '@explorer/shared'
import { Timestamp } from '@explorer/types'
import React from 'react'

import { TransactionField } from '../../../transaction/components/TransactionField'
import { l2TransactionTypeToText } from '../../common'
import { CurrentStatusField } from '../CurrentStatusField'
import { L2TransactionsList } from '../L2TransactionsList'
import { L2TransactionDetailsCard } from './TransactionDetailsCard'

export interface PerpetualMultiTransactionDetailsProps {
  transactionId: number
  stateUpdateId: number | undefined
  data: Extract<PerpetualL2TransactionData, { type: 'MultiTransaction' }>
  timestamp?: Timestamp | undefined
  collateralAsset: CollateralAsset
  altIndex: number | undefined
}

export function PerpetualMultiTransactionDetails(
  props: PerpetualMultiTransactionDetailsProps
) {
  return (
    <L2TransactionDetailsCard transactionId={props.transactionId}>
      <TransactionField label="Type">
        {l2TransactionTypeToText(props.data.type)}
      </TransactionField>
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
    </L2TransactionDetailsCard>
  )
}
