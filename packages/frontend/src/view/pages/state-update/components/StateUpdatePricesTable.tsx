import React from 'react'

import { Asset, assetToInfo } from '../../../../utils/assets'
import { formatWithDecimals } from '../../../../utils/formatting/formatAmount'
import { AssetWithLogo } from '../../../components/AssetWithLogo'
import { Table } from '../../../components/table/Table'

export interface StateUpdatePricesTableProps {
  priceChanges: StateUpdatePriceEntry[]
}

export interface StateUpdatePriceEntry {
  asset: Asset
  price: bigint
  change: bigint
}

export function StateUpdatePricesTable(props: StateUpdatePricesTableProps) {
  return (
    <Table
      columns={[{ header: 'Asset' }, { header: 'Price', numeric: true }]}
      rows={props.priceChanges.map((transaction) => {
        return {
          cells: [
            <AssetWithLogo
              type="small"
              assetInfo={assetToInfo(transaction.asset)}
            />,
            formatWithDecimals(transaction.price, 2, { prefix: '$' }),
          ],
        }
      })}
    />
  )
}
