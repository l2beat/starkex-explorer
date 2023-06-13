import React from 'react'

import { formatTimestamp } from '../../../../../utils/formatting/formatTimestamp'
import { AssetAmount } from '../../../../components/AssetAmount'
import { Card } from '../../../../components/Card'
import { EtherscanLink } from '../../../../components/EtherscanLink'
import { Link } from '../../../../components/Link'
import { TransactionField } from '../../../transaction/components/TransactionField'
import { PerpetualTransactionDetailsProps } from '../../common'
import { CurrentStatusField } from '../CurrentStatusField'

export function PerpetualWithdrawToAddressDetails(
  props: PerpetualTransactionDetailsProps<'WithdrawToAddress'>
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
      <TransactionField label="Ethereum address">
        <EtherscanLink
          type="address"
          address={props.data.ethereumAddress.toString()}
        >
          {props.data.ethereumAddress.toString()}
        </EtherscanLink>
      </TransactionField>
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
