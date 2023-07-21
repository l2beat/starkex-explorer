import React from 'react'

import {
  TransactionField,
  TransactionYesOrNoField,
} from '../../../transaction/components/TransactionField'
import { PerpetualTransactionDetailsProps } from '../../common'
import { AssetTradeCard } from '../AssetTradeCard'
import { CurrentStatusField } from '../CurrentStatusField'
import { TransactionDetailsCard } from './TransactionDetailsCard'

export function PerpetualLiquidateDetails(
  props: PerpetualTransactionDetailsProps<'Liquidate'>
) {
  return (
    <TransactionDetailsCard transactionId={props.transactionId}>
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
      <TransactionYesOrNoField
        label="Is liquidator buying synthetic"
        value={props.data.liquidatorOrder.isBuyingSynthetic}
      />
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
    </TransactionDetailsCard>
  )
}
