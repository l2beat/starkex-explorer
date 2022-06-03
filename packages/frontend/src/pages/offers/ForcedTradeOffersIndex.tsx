import { AssetId } from '@explorer/types'
import React from 'react'

import { Page } from '../common'
import { AssetCell } from '../common/AssetCell'
import { ServerFormAttributes, ServerPagination } from '../common/pagination'
import { Table } from '../common/table'
import { formatCurrency, formatRelativeTime } from '../formatting'
import { AssetIdSelectName, FilteringForm, TypeRadioName } from './filtering'
import { ForcedTradeOffersIndexProps } from './ForcedTradeOffersIndexProps'

export function ForcedTradeOffersIndex({
  account,
  offers,
  assetIds,
  params: { page, perPage, assetId, type },
  total,
}: ForcedTradeOffersIndexProps) {
  const baseUrl = '/forced/offers'

  const paginationParams = new URLSearchParams({
    [ServerFormAttributes.PageInputName]: page.toString(),
    [ServerFormAttributes.PerPageSelectName]: perPage.toString(),
  })
  const filteringParams = new URLSearchParams()
  if (assetId) {
    filteringParams.append(AssetIdSelectName, assetId.toString())
  }
  if (type) {
    filteringParams.append(TypeRadioName, type.toString())
  }

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
      <h1 className="font-sans font-bold text-2xl mb-6 sm:mb-12">
        Forced trade offers
      </h1>
      <FilteringForm
        type={type}
        assetId={assetId}
        assetIds={assetIds}
        baseUrl={baseUrl}
        additionalParams={paginationParams}
      />
      <ServerPagination
        perPage={perPage}
        page={page}
        total={total}
        baseUrl={baseUrl}
        additionalParams={filteringParams}
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
