import React from 'react'

import { formatTimestamp } from '../../../../../utils/formatting/formatTimestamp'
import { AssetAmountCard } from '../../../../components/AssetAmountCard'
import { Link } from '../../../../components/Link'
import { TransactionField } from '../../../transaction/components/TransactionField'
import { PerpetualTransactionDetailsProps } from '../../common'
import { CurrentStatusField } from '../CurrentStatusField'
import { L2TransactionDetailsCard } from './TransactionDetailsCard'

export function PerpetualDepositDetails(
  props: PerpetualTransactionDetailsProps<'Deposit'>
) {
  return (
    <L2TransactionDetailsCard transactionId={props.transactionId}>
      <TransactionField label="Current status">
        <CurrentStatusField stateUpdateId={props.stateUpdateId} />
      </TransactionField>
      <TransactionField label="Position">
        #{props.data.positionId.toString()}
      </TransactionField>

      <TransactionField label="Stark key">
        <Link href={`/users/${props.data.starkKey.toString()}`}>
          {props.data.starkKey.toString()}
        </Link>
      </TransactionField>
      <AssetAmountCard
        className="w-1/2"
        asset={{ hashOrId: props.collateralAsset.assetId }}
        amount={props.data.amount}
      />
      <TransactionField label="Timestamp (UTC)">
        {props.timestamp ? formatTimestamp(props.timestamp) : '-'}
      </TransactionField>
    </L2TransactionDetailsCard>
  )
}
