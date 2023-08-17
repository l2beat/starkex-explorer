import React from 'react'

import { Asset, assetToInfo } from '../../../utils/assets'
import { formatWithDecimals } from '../../../utils/formatting/formatAmount'
import { AssetWithLogo } from '../AssetWithLogo'
import { Table } from '../table/Table'

interface PricesTableProps {
  prices: PriceEntry[]
}

export interface PriceEntry {
  asset: Asset
  priceInCents: bigint
}

export function PricesTable(props: PricesTableProps) {
  return (
    <div>
      <Table
        columns={[{ header: 'Asset' }, { header: 'Price', numeric: true }]}
        rows={props.prices.map((transaction) => {
          return {
            cells: [
              <AssetWithLogo
                type="small"
                assetInfo={assetToInfo(transaction.asset)}
              />,
              formatWithDecimals(transaction.priceInCents, 2, {
                prefix: '$',
              }),
            ],
          }
        })}
      />
    </div>
  )
}
