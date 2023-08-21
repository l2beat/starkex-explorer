import { validateCollateralAssetIdByHash } from '@explorer/shared'
import React from 'react'

import { formatTimestamp } from '../../../../../utils/formatting/formatTimestamp'
import { InlineEllipsis } from '../../../../components/InlineEllipsis'
import { Link } from '../../../../components/Link'
import { TransactionField } from '../../../transaction/components/TransactionField'
import { PerpetualTransactionDetailsProps } from '../../common'
import { AssetTradeCard } from '../AssetTradeCard'
import { CurrentStatusField } from '../CurrentStatusField'
import { L2TransactionDetailsCard } from './TransactionDetailsCard'

export function PerpetualTradeDetails(
  props: PerpetualTransactionDetailsProps<'Trade'>
) {
  const syntheticBuyer = props.data.partyAOrder.isBuyingSynthetic
    ? props.data.partyAOrder
    : props.data.partyBOrder
  const syntheticSeller = props.data.partyAOrder.isBuyingSynthetic
    ? props.data.partyBOrder
    : props.data.partyAOrder
  const collateralAssetId = validateCollateralAssetIdByHash(
    props.data.partyAOrder.collateralAssetId,
    props.collateralAsset
  )
  return (
    <L2TransactionDetailsCard transactionId={props.transactionId}>
      <TransactionField label="Current status">
        <CurrentStatusField stateUpdateId={props.stateUpdateId} />
      </TransactionField>
      <div className="grid grid-cols-3 gap-x-2">
        <TransactionField label="Synthetic seller position">
          #{syntheticSeller.positionId.toString()}
        </TransactionField>
        <TransactionField
          label="Synthetic buyer position"
          className="col-start-3"
        >
          #{syntheticBuyer.positionId.toString()}
        </TransactionField>
      </div>
      <div className="grid grid-cols-3 gap-x-2">
        <TransactionField label="Synthetic seller stark key">
          <Link href={`/users/${syntheticSeller.starkKey.toString()}`}>
            <InlineEllipsis className="max-w-[250px]">
              {syntheticSeller.starkKey.toString()}
            </InlineEllipsis>
          </Link>
        </TransactionField>
        <TransactionField
          label="Synthetic buyer stark key"
          className="col-start-3"
        >
          <Link href={`/users/${syntheticBuyer.starkKey.toString()}`}>
            <InlineEllipsis className="max-w-[250px]">
              {syntheticBuyer.starkKey.toString()}
            </InlineEllipsis>
          </Link>
        </TransactionField>
      </div>
      <AssetTradeCard
        left={{
          asset: { hashOrId: syntheticBuyer.syntheticAssetId },
          amount: props.data.actualSynthetic,
        }}
        right={{
          asset: { hashOrId: collateralAssetId },
          amount: props.data.actualCollateral,
        }}
      />
      <TransactionField label="Timestamp (UTC)">
        {props.timestamp ? formatTimestamp(props.timestamp) : '-'}
      </TransactionField>
    </L2TransactionDetailsCard>
  )
}
