import { Timestamp } from '@explorer/types'
import React from 'react'

import { Asset, assetToInfo } from '../../../../utils/assets'
import {
  formatAmount,
  formatWithDecimals,
} from '../../../../utils/formatting/formatAmount'
import { formatTimestamp } from '../../../../utils/formatting/formatTimestamp'
import { AssetWithLogo } from '../../../components/AssetWithLogo'
import { StatusBadge, StatusType } from '../../../components/StatusBadge'
import { Table } from '../../../components/table/Table'

export interface UserOffersTableProps {
  offers: UserOfferEntry[]
}

export interface UserOfferEntry {
  timestamp: Timestamp
  id: string
  asset: Asset
  amount: bigint
  price: bigint
  totalPrice: bigint
  status: 'CREATED' | 'ACCEPTED' | 'SENT' | 'CANCELLED' | 'EXPIRED'
  type: 'BUY' | 'SELL'
}

export function UserOffersTable({ offers }: UserOffersTableProps) {
  return (
    <Table
      columns={[
        { header: 'Time' },
        { header: 'Id' },
        { header: 'Asset' },
        { header: 'Amount' },
        { header: 'Price' },
        { header: 'Total price' },
        { header: 'Status' },
        { header: 'Type' },
      ]}
      rows={offers.map((offer) => {
        return {
          link: `/offers/${offer.id}`,
          cells: [
            formatTimestamp(offer.timestamp),
            `#${offer.id}`,
            <AssetWithLogo type="small" assetInfo={assetToInfo(offer.asset)} />,
            formatAmount(offer.asset, offer.amount),
            formatWithDecimals(offer.price, 6, { prefix: '$' }),
            formatWithDecimals(offer.totalPrice, 6, { prefix: '$' }),
            <StatusBadge type={toStatusType(offer.status)}>
              {offer.status}
            </StatusBadge>,
            <span className="capitalize">{offer.type.toLowerCase()}</span>,
          ],
        }
      })}
    />
  )
}

function toStatusType(status: UserOfferEntry['status']): StatusType {
  switch (status) {
    case 'CREATED':
      return 'BEGIN'
    case 'ACCEPTED':
      return 'MIDDLE'
    case 'SENT':
      return 'END'
    case 'CANCELLED':
    case 'EXPIRED':
      return 'CANCEL'
  }
}
