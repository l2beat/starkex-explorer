import { CollateralAsset, getCollateralAssetIdFromHash } from '@explorer/shared'
import React, { ReactNode } from 'react'

import { Asset, assetToInfo } from '../../../../../utils/assets'
import { formatAmount } from '../../../../../utils/formatting/formatAmount'
import {
  ArrowRightIcon,
  HorizontalBidirectionalArrow,
} from '../../../../assets/icons/ArrowIcon'
import { PerpetualL2TransactionEntry } from '../../../../pages/l2-transaction/common'
import { AssetWithLogo } from '../../../AssetWithLogo'
import { InlineEllipsis } from '../../../InlineEllipsis'

interface L2TransactionFreeFormProps {
  data: PerpetualL2TransactionEntry['data']
  collateralAsset: CollateralAsset
}

export function PerpetualL2TransactionFreeForm({
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
      const syntheticSeller = data.partyAOrder.isBuyingSynthetic
        ? data.partyBOrder
        : data.partyAOrder

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
          <FreeFormTradeAddresses
            addresses={[
              syntheticSeller.starkKey.toString(),
              syntheticBuyer.starkKey.toString(),
            ]}
          />
        </>
      )
    }
    case 'ForcedTrade': {
      const partyA = {
        starkKey: data.starkKeyA,
        positionId: data.positionIdA,
      }
      const partyB = {
        starkKey: data.starkKeyB,
        positionId: data.positionIdB,
      }
      const syntheticBuyer = data.isABuyingSynthetic ? partyA : partyB
      const syntheticSeller = data.isABuyingSynthetic ? partyB : partyA
      const collateralAssetId = getCollateralAssetIdFromHash(
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
          <FreeFormTradeAddresses
            addresses={[
              syntheticSeller.starkKey.toString(),
              syntheticBuyer.starkKey.toString(),
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
          <FreeFormAddressExchange
            from={data.senderStarkKey.toString()}
            to={data.receiverStarkKey.toString()}
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
          <FreeFormAddressExchange
            from={data.starkKey.toString()}
            to={data.ethereumAddress.toString()}
          />
        </>
      )
    case 'Liquidate': {
      const collateralAssetId = getCollateralAssetIdFromHash(
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
      return null
  }
}

function FreeFormAddressExchange({ from, to }: { from: string; to: string }) {
  return (
    <FreeFormCard>
      <FreeFormLink>{from}</FreeFormLink>
      <ArrowRightIcon className="fill-zinc-500" />
      <FreeFormLink>{to}</FreeFormLink>
    </FreeFormCard>
  )
}

function FreeFormTradeAddresses({
  addresses,
}: {
  addresses: [string, string]
}) {
  return (
    <FreeFormCard>
      <FreeFormLink>{addresses[0]}</FreeFormLink>
      <HorizontalBidirectionalArrow className="mr-1 fill-zinc-500" />
      <FreeFormLink>{addresses[1]}</FreeFormLink>
    </FreeFormCard>
  )
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
  return (
    <span className="flex h-7 items-center gap-1 rounded bg-gray-800 px-2 py-1">
      {children}
    </span>
  )
}

function FreeFormLink({ children }: { children: ReactNode }) {
  return <InlineEllipsis className="max-w-[60px]">{children}</InlineEllipsis>
}
