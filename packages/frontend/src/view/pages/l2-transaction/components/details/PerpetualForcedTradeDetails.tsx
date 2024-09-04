import { validateCollateralAssetIdByHash } from '@explorer/shared'
import React from 'react'

import { formatTimestamp } from '../../../../../utils/formatting/formatTimestamp'
import { InlineEllipsis } from '../../../../components/InlineEllipsis'
import { Link } from '../../../../components/Link'
import { TransactionField } from '../../../transaction/components/TransactionField'
import {
  l2TransactionTypeToText,
  PerpetualTransactionDetailsProps,
} from '../../common'
import { AssetTradeCard } from '../AssetTradeCard'
import { CurrentStatusField } from '../CurrentStatusField'
import { L2TransactionDetailsCard } from './TransactionDetailsCard'

export function PerpetualForcedTradeDetails(
  props: PerpetualTransactionDetailsProps<'ForcedTrade'>
) {
  const partyA = {
    positionId: props.data.positionIdA,
    starkKey: props.data.starkKeyA,
  }
  const partyB = {
    positionId: props.data.positionIdB,
    starkKey: props.data.starkKeyB,
  }
  const syntheticBuyer = props.data.isABuyingSynthetic ? partyA : partyB
  const syntheticSeller = props.data.isABuyingSynthetic ? partyB : partyA
  const collateralAssetId = validateCollateralAssetIdByHash(
    props.data.collateralAssetId,
    props.collateralAsset
  )
  return (
    <L2TransactionDetailsCard transactionId={props.transactionId}>
      <TransactionField label="Type">
        {l2TransactionTypeToText(props.data.type)}
      </TransactionField>
      <TransactionField label="Current status">
        <CurrentStatusField stateUpdateId={props.stateUpdateId} />
      </TransactionField>
      <div className="grid gap-x-2 md:grid-cols-3">
        <TransactionField label="Synthetic buyer position">
          #{syntheticBuyer.positionId.toString()}
        </TransactionField>
        <TransactionField
          label="Synthetic seller position"
          className="col-start-3 text-right md:text-left"
        >
          #{syntheticSeller.positionId.toString()}
        </TransactionField>
      </div>
      <div className="grid gap-y-6 md:grid-cols-3 md:gap-x-2">
        <TransactionField label="Synthetic buyer Stark key">
          <Link href={`/users/${syntheticBuyer.starkKey.toString()}`}>
            <InlineEllipsis className="max-w-[250px]">
              {syntheticBuyer.starkKey.toString()}
            </InlineEllipsis>
          </Link>
        </TransactionField>
        <TransactionField
          label="Synthetic seller Stark key"
          className="md:col-start-3"
        >
          <Link href={`/users/${syntheticSeller.starkKey.toString()}`}>
            <InlineEllipsis className="max-w-[250px]">
              {syntheticSeller.starkKey.toString()}
            </InlineEllipsis>
          </Link>
        </TransactionField>
      </div>
      <AssetTradeCard
        left={{
          asset: { hashOrId: props.data.syntheticAssetId },
          amount: props.data.syntheticAmount,
        }}
        right={{
          asset: { hashOrId: collateralAssetId },
          amount: props.data.collateralAmount,
        }}
      />
      <TransactionField label="Timestamp (UTC)">
        {props.timestamp ? formatTimestamp(props.timestamp) : '-'}
      </TransactionField>
    </L2TransactionDetailsCard>
  )
}
