import { UserDetails } from '@explorer/shared'
import { StarkKey } from '@explorer/types'
import React from 'react'

import { Page } from '../../components/common/page/Page'
import { TableWithPagination } from '../../components/common/table/TableWithPagination'
import {
  UserAssetEntry,
  UserAssetTable,
} from '../../components/user/UserAssetTable'
import { reactToHtml } from '../../reactToHtml'
import { getAssetsTableProps } from './common'

export interface UserAssetPageProps {
  user: UserDetails | undefined
  starkKey: StarkKey
  type: 'SPOT' | 'PERPETUAL'
  assets: UserAssetEntry[]
  limit: number
  offset: number
  total: number
}

export function renderUserAssetPage(props: UserAssetPageProps) {
  return reactToHtml(<UserAssetPage {...props} />)
}

function UserAssetPage(props: UserAssetPageProps) {
  const common = getAssetsTableProps(props.starkKey)
  return (
    <Page path={common.link} description="TODO: description" user={props.user}>
      <div className="flex max-w-[960px] flex-col gap-y-12">
        <TableWithPagination
          {...common}
          // TODO: override title
          visible={props.assets.length}
          limit={props.limit}
          offset={props.offset}
          total={props.total}
        >
          <UserAssetTable
            starkKey={props.starkKey}
            type={props.type}
            assets={props.assets}
          />
        </TableWithPagination>
      </div>
    </Page>
  )
}
