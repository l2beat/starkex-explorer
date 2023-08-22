import React from 'react'

import { formatTimestamp } from '../../../../../utils/formatting/formatTimestamp'
import { AssetPriceCard } from '../../../../components/AssetPriceCard'
import { TransactionField } from '../../../transaction/components/TransactionField'
import {
  l2TransactionTypeToText,
  PerpetualTransactionDetailsProps,
} from '../../common'
import { CurrentStatusField } from '../CurrentStatusField'
import { L2TransactionDetailsCard } from './TransactionDetailsCard'

export function PerpetualOraclePricesTickDetails(
  props: PerpetualTransactionDetailsProps<'OraclePricesTick'>
) {
  return (
    <L2TransactionDetailsCard transactionId={props.transactionId}>
      <TransactionField label="Type">
        {l2TransactionTypeToText(props.data.type)}
      </TransactionField>
      <TransactionField label="Current status">
        <CurrentStatusField stateUpdateId={props.stateUpdateId} />
      </TransactionField>
      <TransactionField label="Date (UTC)">
        {formatTimestamp(props.data.timestamp)}
      </TransactionField>
      <TransactionField label="Oracle prices">
        <div className="grid gap-6 sm:grid-cols-2">
          {props.data.oraclePrices.map((oraclePrice, index) => {
            return (
              <AssetPriceCard
                asset={{ hashOrId: oraclePrice.syntheticAssetId }}
                priceInCents={oraclePrice.price}
                key={`${oraclePrice.syntheticAssetId.toString()}-${index}`}
              />
            )
          })}
        </div>
      </TransactionField>
      <TransactionField label="Timestamp (UTC)">
        {props.timestamp ? formatTimestamp(props.timestamp) : '-'}
      </TransactionField>
    </L2TransactionDetailsCard>
  )
}
