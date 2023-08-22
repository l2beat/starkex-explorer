import React from 'react'

import { formatTimestamp } from '../../../../../utils/formatting/formatTimestamp'
import {
  TransactionField,
  TransactionYesOrNoField,
} from '../../../transaction/components/TransactionField'
import {
  PerpetualTransactionDetailsProps,
  l2TransactionTypeToText,
} from '../../common'
import { AssetTradeCard } from '../AssetTradeCard'
import { CurrentStatusField } from '../CurrentStatusField'
import { L2TransactionDetailsCard } from './TransactionDetailsCard'

export function PerpetualDeleverageDetails(
  props: PerpetualTransactionDetailsProps<'Deleverage'>
) {
  return (
    <L2TransactionDetailsCard transactionId={props.transactionId}>
      <TransactionField label="Type">
        {l2TransactionTypeToText(props.data.type)}
      </TransactionField>
      <TransactionField label="Current status">
        <CurrentStatusField stateUpdateId={props.stateUpdateId} />
      </TransactionField>
      <div className="grid grid-cols-2">
        <TransactionField label="Deleverager position">
          #{props.data.deleveragerPositionId.toString()}
        </TransactionField>
        <TransactionField
          label="Deleveraged position"
          className="text-right md:text-left"
        >
          #{props.data.deleveragedPositionId.toString()}
        </TransactionField>
      </div>
      <TransactionYesOrNoField
        label="Is deleverager buying synthetic?"
        value={props.data.isDeleveragerBuyingSynthetic}
      />
      <AssetTradeCard
        left={{
          asset: { hashOrId: props.data.syntheticAssetId },
          amount: props.data.syntheticAmount,
        }}
        right={{
          asset: { hashOrId: props.collateralAsset.assetId },
          amount: props.data.collateralAmount,
        }}
      />
      <TransactionField label="Timestamp (UTC)">
        {props.timestamp ? formatTimestamp(props.timestamp) : '-'}
      </TransactionField>
    </L2TransactionDetailsCard>
  )
}
