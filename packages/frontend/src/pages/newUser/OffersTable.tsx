import React from 'react'

import { NewTable } from '../common/table'
import { Status } from './Status'
import { OfferEntry } from './UserProps'

export interface OffersTableProps {
  readonly offers: readonly OfferEntry[]
}

export function OffersTable({ offers }: OffersTableProps) {
  return (
    <NewTable
      pageSize={6}
      id="test"
      title="Offers"
      noRowsText="You have no offers"
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
            <Status status={offer.status} />,
            offer.type,
          ],
        }
      })}
    />
  )
}
