import { AssetId } from '@explorer/types'
import React from 'react'

import { Page } from '../common'
import { AssetCell } from '../common/AssetCell'
import { ServerPagination } from '../common/pagination'
import { Table } from '../common/table'
import { formatCurrency, formatRelativeTime } from '../formatting'
import { ForcedTradeOffersIndexProps } from './ForcedTradeOffersIndexProps'

export function ForcedTradeOffersIndex({
  account,
  offers,
  params: { page, perPage },
  total,
}: ForcedTradeOffersIndexProps) {
  return (
    <Page
      title="L2BEAT dYdX Explorer"
      description="Site under construction"
      url="https://dydx.l2beat.com"
      image="/images/under-construction.png"
      stylesheets={['/styles/main.css']}
      scripts={['/scripts/main.js']}
      account={account}
    >
      <h1 className="font-sans font-bold text-2xl mb-12">
        Forced trade offers
      </h1>
      <ServerPagination
        perPage={perPage}
        page={page}
        total={total}
        baseUrl="/forced/offers"
      />
      <Table
        noRowsText="there is no active offers at the moment"
        columns={[
          { header: 'Position ID', numeric: true },
          { header: 'Time' },
          {
            header: 'Asset',
            numeric: true,
            textAlignClass: 'text-left',
            fullWidth: true,
          },
          { header: 'Price', numeric: true },
          { header: 'Total', numeric: true },
          { header: 'Type' },
        ]}
        rows={offers.map((offer) => {
          const link = `/forced/offers/${offer.id}`
          return {
            link,
            cells: [
              offer.positionId.toString(),
              formatRelativeTime(offer.createdAt),
              <AssetCell assetId={offer.assetId} amount={offer.amount} />,
              formatCurrency(offer.price, 'USD'),
              formatCurrency(offer.total, AssetId.USDC),
              offer.type,
            ],
          }
        })}
      />
    </Page>
  )
}
