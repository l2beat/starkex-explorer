import React from 'react'

import { Card } from '../../../../components/Card'
import { TransactionField } from '../../../transaction/components/TransactionField'
import { PerpetualTransactionDetailsProps } from '../../common'
import { AssetTradeCard } from '../AssetTradeCard'
import { CurrentStatusField } from '../CurrentStatusField'

export function PerpetualLiquidateDetails(
  props: PerpetualTransactionDetailsProps<'Liquidate'>
) {
  return (
    <Card className="flex flex-col gap-6">
      <TransactionField label="Current status">
        <CurrentStatusField stateUpdateId={props.stateUpdateId} />
      </TransactionField>
      <TransactionField label="Liquidator stark key">
        {props.data.liquidatorOrder.starkKey.toString()}
      </TransactionField>
      <div className="grid grid-cols-2">
        <TransactionField label="Liquidator position">
          #{props.data.liquidatorOrder.positionId.toString()}
        </TransactionField>
        <TransactionField label="Liquidated position">
          #{props.data.liquidatedPositionId.toString()}
        </TransactionField>
      </div>
      <AssetTradeCard
        synthetic={{
          asset: { hashOrId: props.data.liquidatorOrder.syntheticAssetId },
          amount: props.data.actualSynthetic,
        }}
        collateral={{
          asset: { hashOrId: props.collateralAsset.assetId },
          amount: props.data.actualCollateral,
        }}
      />
      <TransactionField label="Liquidator fee">
        {props.data.actualLiquidatorFee.toString()}
      </TransactionField>
    </Card>
  )
}
