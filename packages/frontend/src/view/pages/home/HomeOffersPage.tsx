import { UserDetails } from '@explorer/shared'
import React from 'react'

import { ContentWrapper } from '../../components/page/ContentWrapper'
import { Page } from '../../components/page/Page'
import { TableWithPagination } from '../../components/table/TableWithPagination'
import { OfferEntry, OffersTable } from '../../components/tables/OffersTable'
import { reactToHtml } from '../../reactToHtml'
import { OFFER_TABLE_PROPS } from './common'

export interface HomeOffersPageProps {
  user: UserDetails | undefined
  offers: OfferEntry[]
  limit: number
  offset: number
  total: number
}

export function renderHomeOffersPage(props: HomeOffersPageProps) {
  return reactToHtml(<HomeOffersPage {...props} />)
}

function HomeOffersPage(props: HomeOffersPageProps) {
  return (
    <Page
      path={OFFER_TABLE_PROPS.path}
      description="All available trade offers"
      user={props.user}
    >
      <ContentWrapper>
        <TableWithPagination
          {...OFFER_TABLE_PROPS}
          visible={props.offers.length}
          limit={props.limit}
          offset={props.offset}
          total={props.total}
        >
          <OffersTable showStatus={false} offers={props.offers} />
        </TableWithPagination>
      </ContentWrapper>
    </Page>
  )
}
