import cx from 'classnames'
import React from 'react'

import { Asset, assetToInfo } from '../../../../utils/assets'
import { formatAmount } from '../../../../utils/formatting/formatAmount'
import { AssetWithLogo } from '../../../components/AssetWithLogo'

interface AmountContainerProps {
  className?: string
  assetLabel: string
  asset: Asset
  amountLabel: string
  amount?: bigint
}

export function AmountContainer(props: AmountContainerProps) {
  const assetInfo = assetToInfo(props.asset)
  return (
    <div
      className={cx(
        'flex items-center justify-between rounded-lg bg-slate-800 p-4',
        props.className
      )}
    >
      <div>
        <p className="mb-2 text-sm font-medium text-zinc-500">
          {props.amountLabel}
        </p>
        <p className="text-xl font-semibold text-white">
          {props.amount !== undefined
            ? formatAmount(props.asset, props.amount)
            : 'Unknown'}
        </p>
      </div>
      <div>
        <p className="mb-2 text-right text-sm font-medium text-zinc-500">
          {props.assetLabel}
        </p>
        <div className="flex justify-end gap-2">
          <AssetWithLogo assetInfo={assetInfo} type="symbol" />
        </div>
      </div>
    </div>
  )
}
