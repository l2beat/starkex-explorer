import { PageContext } from '@explorer/shared'
import { EthereumAddress, StarkKey } from '@explorer/types'
import React from 'react'

import { ContentWrapper } from '../../components/page/ContentWrapper'
import { Page } from '../../components/page/Page'
import { TableWithPagination } from '../../components/table/TableWithPagination'
import { reactToHtml } from '../../reactToHtml'
import { getAssetsTableProps } from './common'
import { UserAssetEntry, UserAssetsTable } from './components/UserAssetTable'
import { UserPageTitle } from './components/UserPageTitle'

interface UserAssetsPageProps {
  context: PageContext
  starkKey: StarkKey
  ethereumAddress: EthereumAddress | undefined
  assets: UserAssetEntry[]
  limit: number
  offset: number
  total: number
}

export function renderUserAssetsPage(props: UserAssetsPageProps) {
  return reactToHtml(<UserAssetsPage {...props} />)
}

function UserAssetsPage(props: UserAssetsPageProps) {
  const common = getAssetsTableProps(props.starkKey)
  const isMine = props.context.user?.starkKey === props.starkKey
  return (
    <Page
      path={common.path}
      description={common.description}
      context={props.context}
    >
      <ContentWrapper>
        <TableWithPagination
          {...common}
          title={
            <UserPageTitle prefix="Assets of user" starkKey={props.starkKey} />
          }
          visible={props.assets.length}
          limit={props.limit}
          offset={props.offset}
          total={props.total}
        >
          <UserAssetsTable
            tradingMode={props.context.tradingMode}
            starkKey={props.starkKey}
            ethereumAddress={props.ethereumAddress}
            assets={props.assets}
            isMine={isMine}
            isFrozen={props.context.freezeStatus === 'frozen'}
          />
        </TableWithPagination>
      </ContentWrapper>
    </Page>
  )
}
