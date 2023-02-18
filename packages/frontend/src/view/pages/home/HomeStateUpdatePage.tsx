import { UserDetails } from '@explorer/shared'
import React from 'react'

import { Page } from '../../components/common/page/Page'
import { TableWithPagination } from '../../components/common/table/TableWithPagination'
import {
  HomeStateUpdateEntry,
  HomeStateUpdateTable,
} from '../../components/home/HomeStateUpdateTable'
import { reactToHtml } from '../../reactToHtml'
import { STATE_UPDATE_TABLE_PROPS } from './common'

export interface HomeStateUpdatePageProps {
  user: UserDetails | undefined
  stateUpdates: HomeStateUpdateEntry[]
  limit: number
  offset: number
  total: number
}

export function renderHomeStateUpdatePage(props: HomeStateUpdatePageProps) {
  return reactToHtml(<HomeStateUpdatePage {...props} />)
}

function HomeStateUpdatePage(props: HomeStateUpdatePageProps) {
  return (
    <Page
      path={STATE_UPDATE_TABLE_PROPS.link}
      description="TODO: description"
      user={props.user}
    >
      <div className="flex max-w-[960px] flex-col gap-y-12">
        <TableWithPagination
          {...STATE_UPDATE_TABLE_PROPS}
          visible={props.stateUpdates.length}
          limit={props.limit}
          offset={props.offset}
          total={props.total}
        >
          <HomeStateUpdateTable stateUpdates={props.stateUpdates} />
        </TableWithPagination>
      </div>
    </Page>
  )
}
