import classNames from 'classnames'
import React from 'react'

import { range } from 'lodash'
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
  const tableCount =
    props.priceChanges.length > 20 ? 3 : props.priceChanges.length > 10 ? 2 : 1

  return (
    <div className={classNames('flex', tableCount === 2 ? 'gap-12' : 'gap-6')}>
      {range(tableCount).map((_, index) => {
        return (
          <Table
            columns={[{ header: 'Asset' }, { header: 'Price', numeric: true }]}
            rows={props.priceChanges
              .filter((_, txIndex) => txIndex % tableCount === index)
              .map((transaction) => {
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
      })}
    </div>
  )
}
