import React from 'react'

import { Card } from '../../../../components/Card'
import { TransactionField } from '../../../transaction/components/TransactionField'
import { PerpetualTransactionDetailsProps } from '../../common'
import { AssetTradeCard } from '../AssetTradeCard'
import { CurrentStatusField } from '../CurrentStatusField'

export function PerpetualDeleverageDetails(
  props: PerpetualTransactionDetailsProps<'Deleverage'>
) {
  return (
    <Card className="flex flex-col gap-6">
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
      <TransactionField label="Is deleverager buying synthetic?">
        {props.data.isDeleveragerBuyingSynthetic ? 'Yes' : 'No'}
      </TransactionField>
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
    </Card>
  )
}
