import { UserDetails } from '@explorer/shared'
import { StarkKey } from '@explorer/types'
import React from 'react'

import { Page } from '../../components/common/page/Page'
import { TableWithPagination } from '../../components/common/table/TableWithPagination'
import {
  UserOfferEntry,
  UserOffersTable,
} from '../../components/user/UserOffersTable'
import { reactToHtml } from '../../reactToHtml'
import { getOfferTableProps } from './common'

export interface UserOffersPageProps {
  user: UserDetails | undefined
  starkKey: StarkKey
  offers: UserOfferEntry[]
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
    <Page path={common.link} description="TODO: description" user={props.user}>
      <div className="flex max-w-[960px] flex-col gap-y-12">
        <TableWithPagination
          {...common}
          // TODO: override title
          visible={props.offers.length}
          limit={props.limit}
          offset={props.offset}
          total={props.total}
        >
          <UserOffersTable offers={props.offers} />
        </TableWithPagination>
      </div>
    </Page>
  )
}
