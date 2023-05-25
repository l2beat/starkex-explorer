import { PageContext } from '@explorer/shared'
import React from 'react'

import { ContentWrapper } from '../../components/page/ContentWrapper'
import { Page } from '../../components/page/Page'
import { TableWithPagination } from '../../components/table/TableWithPagination'
import { reactToHtml } from '../../reactToHtml'
import { STATE_UPDATE_TABLE_PROPS } from './common'
import {
  HomeStateUpdateEntry,
  HomeStateUpdatesTable,
} from './components/HomeStateUpdatesTable'

interface HomeStateUpdatesPageProps {
  context: PageContext
  stateUpdates: HomeStateUpdateEntry[]
  limit: number
  offset: number
  total: number
}

export function renderHomeStateUpdatesPage(props: HomeStateUpdatesPageProps) {
  return reactToHtml(<HomeStateUpdatesPage {...props} />)
}

function HomeStateUpdatesPage(props: HomeStateUpdatesPageProps) {
  return (
    <Page
      path={STATE_UPDATE_TABLE_PROPS.path}
      description="Latest state updates"
      context={props.context}
    >
      <ContentWrapper>
        <TableWithPagination
          {...STATE_UPDATE_TABLE_PROPS}
          visible={props.stateUpdates.length}
          limit={props.limit}
          offset={props.offset}
          total={props.total}
        >
          <HomeStateUpdatesTable stateUpdates={props.stateUpdates} />
        </TableWithPagination>
      </ContentWrapper>
    </Page>
  )
}
