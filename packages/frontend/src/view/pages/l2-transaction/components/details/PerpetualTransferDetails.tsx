import React from 'react'

import { formatTimestamp } from '../../../../../utils/formatting/formatTimestamp'
import { AssetAmount } from '../../../../components/AssetAmount'
import { Card } from '../../../../components/Card'
import { InlineEllipsis } from '../../../../components/InlineEllipsis'
import { Link } from '../../../../components/Link'
import { TransactionField } from '../../../transaction/components/TransactionField'
import { PerpetualTransactionDetailsProps } from '../../common'
import { CurrentStatusField } from '../CurrentStatusField'

export function PerpetualTransferDetails(
  props: PerpetualTransactionDetailsProps<'Transfer'>
) {
  return (
    <Card className="flex flex-col gap-6">
      <TransactionField label="Current status">
        <CurrentStatusField stateUpdateId={props.stateUpdateId} />
      </TransactionField>
      <div className="grid grid-cols-2 gap-x-2">
        <TransactionField label="Sender Position ID">
          {props.data.senderPositionId.toString()}
        </TransactionField>
        <TransactionField label="Receiver Position ID">
          {props.data.receiverPositionId.toString()}
        </TransactionField>
      </div>
      <div className="grid grid-cols-2 gap-x-2">
        <TransactionField label="Sender Stark key">
          <Link href={`/users/${props.data.senderStarkKey.toString()}`}>
            <InlineEllipsis className="max-w-[400px]">
              {props.data.senderStarkKey.toString()}
            </InlineEllipsis>
          </Link>
        </TransactionField>
        <TransactionField label="Receiver Stark key">
          <Link href={`/users/${props.data.receiverStarkKey.toString()}`}>
            <InlineEllipsis className="max-w-[400px]">
              {props.data.receiverStarkKey.toString()}
            </InlineEllipsis>
          </Link>
        </TransactionField>
      </div>
      <AssetAmount
        className="w-1/2"
        asset={{ hashOrId: props.collateralAsset.assetId }}
        amount={props.data.amount}
      />
      <TransactionField label="Expiration date (UTC)">
        {formatTimestamp(props.data.expirationTimestamp)}
      </TransactionField>
      <TransactionField label="Nonce">
        {props.data.nonce.toString()}
      </TransactionField>
    </Card>
  )
}
