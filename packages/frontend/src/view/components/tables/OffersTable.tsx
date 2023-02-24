import { Timestamp } from '@explorer/types'
import React, { ReactNode } from 'react'

import { Asset, assetToInfo } from '../../../utils/assets'
import {
  formatAmount,
  formatWithDecimals,
} from '../../../utils/formatting/formatAmount'
import { AssetWithLogo } from '../AssetWithLogo'
import { StatusBadge, StatusType } from '../StatusBadge'
import { Table } from '../table/Table'
import { Column } from '../table/types'
import { TimeCell } from '../TimeCell'

export interface OffersTableProps {
  offers: OfferEntry[]
  hideStatus?: boolean
}

export interface OfferEntry {
  timestamp: Timestamp
  id: string
  asset: Asset
  amount: bigint
  price: bigint
  totalPrice: bigint
  status: 'CREATED' | 'ACCEPTED' | 'SENT' | 'CANCELLED' | 'EXPIRED'
  type: 'BUY' | 'SELL'
}

export function OffersTable(props: OffersTableProps) {
  const columns: Column[] = []
  columns.push(
    { header: 'Time' },
    { header: 'Id' },
    { header: 'Asset' },
    { header: 'Amount', numeric: true },
    { header: 'Price', numeric: true },
    { header: 'Total price', numeric: true }
  )
  if (!props.hideStatus) {
    columns.push({ header: 'Status' })
  }
  columns.push({ header: 'Type' })

  return (
    <Table
      columns={columns}
      rows={props.offers.map((offer) => {
        const cells: ReactNode[] = []
        cells.push(
          <TimeCell timestamp={offer.timestamp} />,
          <span className="text-blue-600 underline">#{offer.id}</span>,
          <AssetWithLogo type="small" assetInfo={assetToInfo(offer.asset)} />,
          formatAmount(offer.asset, offer.amount),
          formatWithDecimals(offer.price, 6, { prefix: '$' }),
          formatWithDecimals(offer.totalPrice, 6, { prefix: '$' })
        )
        if (!props.hideStatus) {
          cells.push(
            <StatusBadge type={toStatusType(offer.status)}>
              {toStatusText(offer.status)}
            </StatusBadge>
          )
        }
        cells.push(
          <span className="capitalize">{offer.type.toLowerCase()}</span>
        )

        return {
          link: `/offers/${offer.id}`,
          cells,
        }
      })}
    />
  )
}

function toStatusType(status: OfferEntry['status']): StatusType {
  switch (status) {
    case 'CREATED':
      return 'BEGIN'
    case 'ACCEPTED':
    case 'SENT':
      return 'MIDDLE'
    case 'CANCELLED':
    case 'EXPIRED':
      return 'CANCEL'
  }
}

function toStatusText(status: OfferEntry['status']): string {
  switch (status) {
    case 'CREATED':
      return 'CREATED (1/5)'
    case 'ACCEPTED':
      return 'ACCEPTED (2/5)'
    case 'SENT':
      return 'SENT (3/5)'
    case 'CANCELLED':
      return 'CANCELLED'
    case 'EXPIRED':
      return 'EXPIRED'
  }
}
