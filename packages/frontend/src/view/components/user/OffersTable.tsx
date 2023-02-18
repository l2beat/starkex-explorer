import { Timestamp } from '@explorer/types'
import React from 'react'

import { StatusBadge, StatusType } from '../common/StatusBadge'
import { Table } from '../common/table/Table'

export interface OffersTableProps {
  readonly offers: readonly OfferEntry[]
}

export interface OfferEntry {
  readonly timestamp: Timestamp
  readonly asset: string
  readonly assetIcon: string
  readonly amount: bigint
  readonly price: bigint
  readonly status: 'CREATED' | 'ACCEPTED' | 'SENT' | 'CANCELLED' | 'EXPIRED'
  readonly type: 'BUY' | 'SELL'
}

export function OffersTable({ offers }: OffersTableProps) {
  return (
    <Table
      columns={[
        { header: 'TIME' },
        { header: 'ASSET' },
        { header: 'AMOUNT' },
        { header: 'PRICE' },
        { header: 'TOTAL PRICE' },
        { header: 'STATUS' },
        { header: 'TYPE' },
      ]}
      rows={offers.map((offer) => {
        const link = `/offers/${offer.asset}` //TODO: Construct a proper link
        const date = new Date(offer.timestamp.valueOf())
        const totalPrice = offer.amount * offer.price
        return {
          link,
          cells: [
            `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`,
            offer.asset,
            offer.amount.toString(),
            `$${offer.price.toString()}`,
            `$${totalPrice.toString()}`,
            <StatusBadge type={toStatusType(offer.status)}>
              {offer.status}
            </StatusBadge>,
            offer.type,
          ],
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
      return 'MIDDLE'
    case 'SENT':
      return 'END'
    case 'CANCELLED':
    case 'EXPIRED':
      return 'CANCEL'
  }
}
