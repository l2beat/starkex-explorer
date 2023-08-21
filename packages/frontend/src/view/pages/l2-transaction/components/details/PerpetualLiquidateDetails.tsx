import React from 'react'

import { formatTimestamp } from '../../../../../utils/formatting/formatTimestamp'
import {
  TransactionField,
  TransactionYesOrNoField,
} from '../../../transaction/components/TransactionField'
import { PerpetualTransactionDetailsProps } from '../../common'
import { AssetTradeCard } from '../AssetTradeCard'
import { CurrentStatusField } from '../CurrentStatusField'
import { L2TransactionDetailsCard } from './TransactionDetailsCard'

export function PerpetualLiquidateDetails(
  props: PerpetualTransactionDetailsProps<'Liquidate'>
) {
  return (
    <L2TransactionDetailsCard transactionId={props.transactionId}>
      <TransactionField label="Current status">
        <CurrentStatusField stateUpdateId={props.stateUpdateId} />
      </TransactionField>
      <TransactionField label="Liquidator stark key">
        {props.data.liquidatorOrder.starkKey.toString()}
      </TransactionField>
      <div className="grid grid-cols-2">
        <TransactionField label="Liquidator position">
          #{props.data.liquidatorOrder.positionId.toString()}
        </TransactionField>
        <TransactionField label="Liquidated position">
          #{props.data.liquidatedPositionId.toString()}
        </TransactionField>
      </div>
      <TransactionYesOrNoField
        label="Is liquidator buying synthetic"
        value={props.data.liquidatorOrder.isBuyingSynthetic}
      />
      <AssetTradeCard
        left={{
          asset: { hashOrId: props.data.liquidatorOrder.syntheticAssetId },
          amount: props.data.actualSynthetic,
        }}
        right={{
          asset: { hashOrId: props.collateralAsset.assetId },
          amount: props.data.actualCollateral,
        }}
      />
      <TransactionField label="Timestamp (UTC)">
        {props.timestamp ? formatTimestamp(props.timestamp) : '-'}
      </TransactionField>
    </L2TransactionDetailsCard>
  )
}
