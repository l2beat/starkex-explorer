import React from 'react'

import { PageHeading } from '../common/header/PageHeading'
import { Page } from '../common/page/Page'
import { ServerFormAttributes, ServerPagination } from '../common/pagination'
import { AssetIdSelectName, FilteringForm, TypeRadioName } from './filtering'
import { ForcedTradeOffersIndexProps } from './ForcedTradeOffersIndexProps'
import { ForcedTradeOffersTable } from './ForcedTradeOffersTable'

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
      <ForcedTradeOffersTable offers={offers} />
    </Page>
  )
}
