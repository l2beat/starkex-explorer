import { UserDetails } from '@explorer/shared'
import React from 'react'

import { Page } from '../../components/common/page/Page'
import { TableWithPagination } from '../../components/common/table/TableWithPagination'
import {
  HomeOfferEntry,
  HomeOffersTable,
} from '../../components/home/HomeOffersTable'
import { reactToHtml } from '../../reactToHtml'
import { OFFER_TABLE_PROPS } from './common'

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
      <div className="flex max-w-[960px] flex-col gap-y-12">
        <TableWithPagination
          {...OFFER_TABLE_PROPS}
          visible={props.offers.length}
          limit={props.limit}
          offset={props.offset}
          total={props.total}
        >
          <HomeOffersTable offers={props.offers} />
        </TableWithPagination>
      </div>
    </Page>
  )
}
