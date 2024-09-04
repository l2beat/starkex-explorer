import {
  CollateralAsset,
  validateCollateralAssetIdByHash,
} from '@explorer/shared'
import React, { ReactNode } from 'react'

import { Asset, assetToInfo } from '../../../../../utils/assets'
import { formatAmount } from '../../../../../utils/formatting/formatAmount'
import { HorizontalBidirectionalArrow } from '../../../../assets/icons/ArrowIcon'
import { PerpetualL2TransactionEntry } from '../../../../pages/l2-transaction/common'
import { AssetWithLogo } from '../../../AssetWithLogo'

interface L2TransactionFreeFormProps {
  data: PerpetualL2TransactionEntry['data']
  collateralAsset: CollateralAsset
}

export function PerpetualL2TransactionInfoCell({
  data,
  collateralAsset,
}: L2TransactionFreeFormProps) {
  switch (data.type) {
    case 'ForcedWithdrawal':
    case 'Deposit':
      return (
        <FreeFormAssetWithAmount
          asset={{ hashOrId: collateralAsset.assetId }}
          amount={data.amount}
        />
      )
    case 'Trade': {
      const syntheticBuyer = data.partyAOrder.isBuyingSynthetic
        ? data.partyAOrder
        : data.partyBOrder

      return (
        <>
          <FreeFormTradeAssets
            exchange={[
              {
                asset: { hashOrId: syntheticBuyer.syntheticAssetId },
                amount: data.actualSynthetic,
              },
              {
                asset: { hashOrId: collateralAsset.assetId },
                amount: data.actualCollateral,
              },
            ]}
          />
        </>
      )
    }
    case 'ForcedTrade': {
      const collateralAssetId = validateCollateralAssetIdByHash(
        data.collateralAssetId,
        collateralAsset
      )
      return (
        <>
          <FreeFormTradeAssets
            exchange={[
              {
                asset: { hashOrId: data.syntheticAssetId },
                amount: data.syntheticAmount,
              },
              {
                asset: { hashOrId: collateralAssetId },
                amount: data.collateralAmount,
              },
            ]}
          />
        </>
      )
    }
    case 'Transfer':
    case 'ConditionalTransfer':
      return (
        <>
          <FreeFormAssetWithAmount
            asset={{ hashOrId: collateralAsset.assetId }}
            amount={data.amount}
          />
        </>
      )
    case 'WithdrawalToAddress':
      return (
        <>
          <FreeFormAssetWithAmount
            asset={{ hashOrId: collateralAsset.assetId }}
            amount={data.amount}
          />
        </>
      )
    case 'Liquidate': {
      const collateralAssetId = validateCollateralAssetIdByHash(
        data.liquidatorOrder.collateralAssetId,
        collateralAsset
      )
      return (
        <FreeFormTradeAssets
          exchange={[
            {
              asset: { hashOrId: data.liquidatorOrder.syntheticAssetId },
              amount: data.actualSynthetic,
            },
            {
              asset: { hashOrId: collateralAssetId },
              amount: data.actualCollateral,
            },
          ]}
        />
      )
    }
    case 'Deleverage':
      return (
        <FreeFormTradeAssets
          exchange={[
            {
              asset: { hashOrId: data.syntheticAssetId },
              amount: data.syntheticAmount,
            },
            {
              asset: { hashOrId: collateralAsset.assetId },
              amount: data.collateralAmount,
            },
          ]}
        />
      )
    default:
      return <span>-</span>
  }
}

function FreeFormTradeAssets({
  exchange,
}: {
  exchange: [{ asset: Asset; amount: bigint }, { asset: Asset; amount: bigint }]
}) {
  return (
    <FreeFormCard>
      {formatAmount(exchange[0].asset, exchange[0].amount)}
      <AssetWithLogo type="small" assetInfo={assetToInfo(exchange[0].asset)} />
      <HorizontalBidirectionalArrow className="fill-zinc-500" />
      {formatAmount(exchange[1].asset, exchange[1].amount)}
      <AssetWithLogo type="small" assetInfo={assetToInfo(exchange[1].asset)} />
    </FreeFormCard>
  )
}

function FreeFormAssetWithAmount({
  asset,
  amount,
}: {
  asset: Asset
  amount: bigint
}) {
  return (
    <FreeFormCard>
      {formatAmount(asset, amount)}
      <AssetWithLogo type="small" assetInfo={assetToInfo(asset)} />
    </FreeFormCard>
  )
}

function FreeFormCard({ children }: { children: ReactNode }) {
  return <span className="flex h-7 items-center gap-1">{children}</span>
}
