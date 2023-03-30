import { UserDetails } from '@explorer/shared'
import { StarkKey } from '@explorer/types'
import React from 'react'

import { ContentWrapper } from '../../components/page/ContentWrapper'
import { Page } from '../../components/page/Page'
import { TableWithPagination } from '../../components/table/TableWithPagination'
import { OfferEntry, OffersTable } from '../../components/tables/OffersTable'
import { reactToHtml } from '../../reactToHtml'
import { getOfferTableProps } from './common'
import { UserPageTitle } from './components/UserPageTitle'

export interface UserOffersPageProps {
  user: UserDetails | undefined
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
    <Page path={common.path} description={common.description} user={props.user}>
      <ContentWrapper>
        <TableWithPagination
          {...common}
          title={<UserPageTitle prefix="Offers of" starkKey={props.starkKey} />}
          visible={props.offers.length}
          limit={props.limit}
          offset={props.offset}
          total={props.total}
        >
          <OffersTable showStatus showRole offers={props.offers} />
        </TableWithPagination>
      </ContentWrapper>
    </Page>
  )
}
