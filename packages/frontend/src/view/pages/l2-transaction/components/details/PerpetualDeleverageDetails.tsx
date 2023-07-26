import React from 'react'

import {
  TransactionField,
  TransactionYesOrNoField,
} from '../../../transaction/components/TransactionField'
import { PerpetualTransactionDetailsProps } from '../../common'
import { AssetTradeCard } from '../AssetTradeCard'
import { CurrentStatusField } from '../CurrentStatusField'
import { L2TransactionDetailsCard } from './TransactionDetailsCard'

export function PerpetualDeleverageDetails(
  props: PerpetualTransactionDetailsProps<'Deleverage'>
) {
  return (
    <L2TransactionDetailsCard transactionId={props.transactionId}>
      <TransactionField label="Current status">
        <CurrentStatusField stateUpdateId={props.stateUpdateId} />
      </TransactionField>
      <div className="grid grid-cols-2">
        <TransactionField label="Deleverager position">
          #{props.data.deleveragerPositionId.toString()}
        </TransactionField>
        <TransactionField label="Deleveraged position">
          #{props.data.deleveragedPositionId.toString()}
        </TransactionField>
      </div>
      <TransactionYesOrNoField
        label="Is deleverager buying synthetic?"
        value={props.data.isDeleveragerBuyingSynthetic}
      />
      <AssetTradeCard
        synthetic={{
          asset: { hashOrId: props.data.syntheticAssetId },
          amount: props.data.syntheticAmount,
        }}
        collateral={{
          asset: { hashOrId: props.collateralAsset.assetId },
          amount: props.data.collateralAmount,
        }}
      />
    </L2TransactionDetailsCard>
  )
}
