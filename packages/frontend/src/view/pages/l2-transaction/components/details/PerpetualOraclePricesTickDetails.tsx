import React from 'react'

import { formatTimestamp } from '../../../../../utils/formatting/formatTimestamp'
import { AssetPriceCard } from '../../../../components/AssetPriceCard'
import { Card } from '../../../../components/Card'
import { TransactionField } from '../../../transaction/components/TransactionField'
import { PerpetualTransactionDetailsProps } from '../../common'
import { CurrentStatusField } from '../CurrentStatusField'

export function PerpetualOraclePricesTickDetails(
  props: PerpetualTransactionDetailsProps<'OraclePricesTick'>
) {
  return (
    <Card className="flex flex-col gap-6">
      <TransactionField label="Current status">
        <CurrentStatusField stateUpdateId={props.stateUpdateId} />
      </TransactionField>
      <TransactionField label="Date (UTC)">
        {formatTimestamp(props.data.timestamp)}
      </TransactionField>
      <TransactionField label="Oracle prices">
        <div className="grid grid-cols-2 gap-6">
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
    </Card>
  )
}
