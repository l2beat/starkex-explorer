import classNames from 'classnames'
import range from 'lodash/range'
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
  const tableCount = props.prices.length == 1 ? 1 : 2

  return (
    <div className={classNames('flex', tableCount === 2 && 'gap-12')}>
      {range(tableCount).map((index) => {
        return (
          <Table
            key={index}
            columns={[{ header: 'Asset' }, { header: 'Price', numeric: true }]}
            rows={props.prices
              .filter((_, txIndex) => txIndex % tableCount === index)
              .map((transaction) => {
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
        )
      })}
    </div>
  )
}
