import { UserDetails } from '@explorer/shared'
import React from 'react'

import { ContentWrapper } from '../../components/page/ContentWrapper'
import { Page } from '../../components/page/Page'
import { TableWithPagination } from '../../components/table/TableWithPagination'
import { reactToHtml } from '../../reactToHtml'
import { OFFER_TABLE_PROPS } from './common'
import { HomeOfferEntry, HomeOffersTable } from './components/HomeOffersTable'

export interface HomeOffersPageProps {
  user: UserDetails | undefined
  offers: HomeOfferEntry[]
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
      path={OFFER_TABLE_PROPS.link}
      description="TODO: description"
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
          <HomeOffersTable offers={props.offers} />
        </TableWithPagination>
      </ContentWrapper>
    </Page>
  )
}
