import { CollateralAsset } from '@explorer/shared'
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
    case 'Deposit':
      return (
        <FreeFormAssetWithAmount
          asset={{ hashOrId: collateralAsset.assetId }}
          amount={data.amount}
        />
      )
    case 'Trade':
      const buyer = data.partyAOrder.isBuyingSynthetic
        ? data.partyAOrder
        : data.partyBOrder
      const seller = data.partyAOrder.isBuyingSynthetic
        ? data.partyBOrder
        : data.partyAOrder
      return (
        <>
          <FreeFormTradeAssets
            exchange={[
              {
                asset: { hashOrId: collateralAsset.assetId },
                amount: data.actualCollateral,
              },
              {
                asset: { hashOrId: buyer.syntheticAssetId },
                amount: data.actualSynthetic,
              },
            ]}
          />
          <FreeFormTradeAddresses
            addresses={[buyer.starkKey.toString(), seller.starkKey.toString()]}
          />
        </>
      )
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
    case 'WithdrawToAddress':
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
    default:
      return null
  }
}

function FreeFormAddressExchange({ from, to }: { from: string; to: string }) {
  return (
    <FreeFormCard>
      <FreeFormLink>{from}</FreeFormLink>
      <ArrowRightIcon />
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
      <HorizontalBidirectionalArrow />
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
      <HorizontalBidirectionalArrow />
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
