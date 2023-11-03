import { PageContext } from '@explorer/shared'
import { StarkKey } from '@explorer/types'
import React from 'react'

import { ContentWrapper } from '../../components/page/ContentWrapper'
import { Page } from '../../components/page/Page'
import { TableWithPagination } from '../../components/table/TableWithPagination'
import { OfferEntry, OffersTable } from '../../components/tables/OffersTable'
import { reactToHtml } from '../../reactToHtml'
import { getOfferTableProps } from './common'
import { UserPageTitle } from './components/UserPageTitle'

interface UserOffersPageProps {
  context: PageContext<'perpetual'>
  starkKey: StarkKey
  offers: OfferEntry[]
  limit: number
  offset: number
  total: number
}

export function renderUserOffersPage(props: UserOffersPageProps) {
  return reactToHtml(<UserOffersPage {...props} />)
}

function UserOffersPage(props: UserOffersPageProps) {
  const common = getOfferTableProps(props.starkKey)
  return (
    <Page
      path={common.path}
      description={common.description}
      context={props.context}
    >
      <ContentWrapper>
        <TableWithPagination
          {...common}
          title={<UserPageTitle prefix="Offers of" starkKey={props.starkKey} />}
          visible={props.offers.length}
          limit={props.limit}
          offset={props.offset}
          total={props.total}
        >
          <OffersTable
            offers={props.offers}
            context={props.context}
            showRole
            showOfferMatchColumn
          />
        </TableWithPagination>
      </ContentWrapper>
    </Page>
  )
}
