import React from 'react'

import { AssetWithAmountCard } from '../../../../components/AssetWithAmountCard'
import { Card } from '../../../../components/Card'
import { Link } from '../../../../components/Link'
import { TransactionField } from '../../../transaction/components/TransactionField'
import { PerpetualTransactionDetailsProps } from '../../common'
import { CurrentStatusField } from '../CurrentStatusField'

export function PerpetualDepositDetails(
  props: PerpetualTransactionDetailsProps<'Deposit'>
) {
  return (
    <Card className="flex flex-col gap-6">
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
      <AssetWithAmountCard
        className="w-1/2"
        asset={{ hashOrId: props.collateralAsset.assetId }}
        amount={props.data.amount}
      />
    </Card>
  )
}
