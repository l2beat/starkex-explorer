import React from 'react'

import { formatTimestamp } from '../../../../../utils/formatting/formatTimestamp'
import { AssetAmountCard } from '../../../../components/AssetAmountCard'
import { EtherscanLink } from '../../../../components/EtherscanLink'
import { InlineEllipsis } from '../../../../components/InlineEllipsis'
import { Link } from '../../../../components/Link'
import { TransactionField } from '../../../transaction/components/TransactionField'
import {
  l2TransactionTypeToText,
  PerpetualTransactionDetailsProps,
} from '../../common'
import { CurrentStatusField } from '../CurrentStatusField'
import { L2TransactionDetailsCard } from './TransactionDetailsCard'

export function PerpetualWithdrawalToAddressDetails(
  props: PerpetualTransactionDetailsProps<'WithdrawalToAddress'> & {
    chainId: number
  }
) {
  return (
    <L2TransactionDetailsCard transactionId={props.transactionId}>
      <TransactionField label="Type">
        {l2TransactionTypeToText(props.data.type)}
      </TransactionField>
      <TransactionField label="Current status">
        <CurrentStatusField stateUpdateId={props.stateUpdateId} />
      </TransactionField>
      <TransactionField label="Position">
        #{props.data.positionId.toString()}
      </TransactionField>
      <TransactionField label="Stark key">
        <Link href={`/users/${props.data.starkKey.toString()}`}>
          <InlineEllipsis className="max-w-[250px] sm:max-w-[450px] md:max-w-full">
            {props.data.starkKey.toString()}
          </InlineEllipsis>
        </Link>
      </TransactionField>
      <TransactionField label="Ethereum address">
        <EtherscanLink
          chainId={props.chainId}
          type="address"
          address={props.data.ethereumAddress.toString()}
        >
          <InlineEllipsis className="max-w-[250px] sm:max-w-[450px] md:max-w-full">
            {props.data.ethereumAddress.toString()}
          </InlineEllipsis>
        </EtherscanLink>
      </TransactionField>
      <AssetAmountCard
        className="md:w-1/2"
        asset={{ hashOrId: props.collateralAsset.assetId }}
        amount={props.data.amount}
      />
      <TransactionField label="Expiration date (UTC)">
        {formatTimestamp(props.data.expirationTimestamp)}
      </TransactionField>
      <TransactionField label="Nonce">
        {props.data.nonce.toString()}
      </TransactionField>
      <TransactionField label="Timestamp (UTC)">
        {props.timestamp ? formatTimestamp(props.timestamp) : '-'}
      </TransactionField>
    </L2TransactionDetailsCard>
  )
}
