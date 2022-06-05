import { AssetId } from '@explorer/types'
import React from 'react'

import { PageHeading } from '../common/header/PageHeading'
import { Page } from '../common/page/Page'
import { ServerFormAttributes, ServerPagination } from '../common/pagination'
import { Table } from '../common/table'
import { AssetCell } from '../common/table/AssetCell'
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
      title="Forced trade offer list"
      description="Browse the list of all forced trade offers submitted by users of the system."
      path="/forced/offers"
      account={account}
    >
      <PageHeading>Forced trade offers</PageHeading>
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
