import { CollateralAsset } from '@explorer/shared'
import React, { ReactNode } from 'react'

import { Asset, assetToInfo } from '../../../../../utils/assets'
import { formatAmount } from '../../../../../utils/formatting/formatAmount'
import { ArrowRightIcon } from '../../../../assets/icons/ArrowIcon'
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
      return (
        <>
          <FreeFormAssetExchange
            from={{
              asset: { hashOrId: data.partyAOrder.syntheticAssetId },
              amount: data.partyAOrder.syntheticAmount,
            }}
            to={{
              asset: { hashOrId: data.partyBOrder.syntheticAssetId },
              amount: data.partyBOrder.syntheticAmount,
            }}
          />
          <FreeFormAddressExchange
            from={data.partyAOrder.starkKey.toString()}
            to={data.partyBOrder.starkKey.toString()}
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

function FreeFormAssetExchange({
  from,
  to,
}: {
  from: { asset: Asset; amount: bigint }
  to: { asset: Asset; amount: bigint }
}) {
  return (
    <FreeFormCard>
      {formatAmount(from.asset, from.amount)}
      <AssetWithLogo type="small" assetInfo={assetToInfo(from.asset)} />
      <ArrowRightIcon />
      {formatAmount(to.asset, to.amount)}
      <AssetWithLogo type="small" assetInfo={assetToInfo(to.asset)} />
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
