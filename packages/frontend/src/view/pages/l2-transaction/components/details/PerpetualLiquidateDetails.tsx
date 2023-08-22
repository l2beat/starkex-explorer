import React from 'react'

import { formatTimestamp } from '../../../../../utils/formatting/formatTimestamp'
import { InlineEllipsis } from '../../../../components/InlineEllipsis'
import { Link } from '../../../../components/Link'
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

export function PerpetualLiquidateDetails(
  props: PerpetualTransactionDetailsProps<'Liquidate'>
) {
  return (
    <L2TransactionDetailsCard transactionId={props.transactionId}>
      <TransactionField label="Type">
        {l2TransactionTypeToText(props.data.type)}
      </TransactionField>
      <TransactionField label="Current status">
        <CurrentStatusField stateUpdateId={props.stateUpdateId} />
      </TransactionField>
      <TransactionField label="Liquidator stark key">
        <Link href={`/users/${props.data.liquidatorOrder.starkKey.toString()}`}>
          <InlineEllipsis className="max-w-[250px] sm:max-w-[550px] md:max-w-full">
            {props.data.liquidatorOrder.starkKey.toString()}
          </InlineEllipsis>
        </Link>
      </TransactionField>
      <div className="grid grid-cols-2">
        <TransactionField label="Liquidator position">
          #{props.data.liquidatorOrder.positionId.toString()}
        </TransactionField>
        <TransactionField
          label="Liquidated position"
          className="text-right md:text-left"
        >
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
