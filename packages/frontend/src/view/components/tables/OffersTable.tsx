import { Timestamp } from '@explorer/types'
import { default as React, ReactNode } from 'react'

import { Asset, assetToInfo } from '../../../utils/assets'
import {
  formatAmount,
  formatWithDecimals,
} from '../../../utils/formatting/formatAmount'
import { AssetWithLogo } from '../AssetWithLogo'
import { Link } from '../Link'
import { StatusBadge, StatusType } from '../StatusBadge'
import { Table } from '../table/Table'
import { Column } from '../table/types'
import { TimeCell } from '../TimeCell'

export interface OffersTableProps {
  offers: OfferEntry[]
  showStatus?: boolean
  showRole?: boolean
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
  role?: 'MAKER' | 'TAKER'
}

export function OffersTable(props: OffersTableProps) {
  const columns: Column[] = [
    { header: 'Time' },
    { header: 'Id' },
    { header: 'Asset' },
    { header: 'Amount', numeric: true },
    { header: 'Price', numeric: true },
    { header: 'Total price', numeric: true },
    ...(props.showStatus ? [{ header: 'Status' }] : []),
    ...(props.showRole ? [{ header: 'Role' }] : []),
    { header: 'Type' },
  ]

  return (
    <Table
      columns={columns}
      rows={props.offers.map((offer) => {
        const cells: ReactNode[] = [
          <TimeCell timestamp={offer.timestamp} />,
          <Link>#{offer.id}</Link>,
          <AssetWithLogo type="small" assetInfo={assetToInfo(offer.asset)} />,
          formatAmount(offer.asset, offer.amount),
          formatWithDecimals(offer.price, 6, { prefix: '$' }),
          formatWithDecimals(offer.totalPrice, 6, { prefix: '$' }),
          ...(props.showStatus
            ? [
                <StatusBadge type={toStatusType(offer.status)}>
                  {toStatusText(offer.status)}
                </StatusBadge>,
              ]
            : []),
          ...(props.showRole
            ? [<span className="capitalize">{offer.role?.toLowerCase()}</span>]
            : []),
          <span className="capitalize">{offer.type.toLowerCase()}</span>,
        ]

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
      return 'CREATED (1/3)'
    case 'ACCEPTED':
      return 'ACCEPTED (2/3)'
    case 'SENT':
      return 'SENT (3/3)'
    case 'CANCELLED':
      return 'CANCELLED'
    case 'EXPIRED':
      return 'EXPIRED'
  }
}
