import React from 'react'

import { Page } from '../common'
import { AssetNameCell } from '../common/AssetNameCell'
import { SearchBar } from '../common/SearchBar'
import { SimpleLink } from '../common/SimpleLink'
import { Table } from '../common/Table'
import { formatHash } from '../formatHash'
import { formatLargeNumber } from '../formatLargeNumber'
import { formatTime } from '../formatTime'
import { FreezeButton } from './FreezeButton'
import { HomeProps } from './HomeProps'
import { Stat } from './Stat'
import { tvlElId } from './tvlElId'

export function Home(props: HomeProps) {
  return (
    <Page
      title="L2BEAT dYdX Explorer"
      description="Site under construction"
      url="https://dydx.l2beat.com"
      image="/images/under-construction.png"
      stylesheets={['/styles/main.css']}
      scripts={['/scripts/main.js']}
      account={props.account}
      withoutSearch
    >
      <div className="mb-12 flex gap-x-4 items-center">
        <Stat title="Total Value Locked" value="-" valueId={tvlElId} />
        <Stat title="State updates" value={props.totalUpdates.toString()} />
        <Stat
          title="Tracked positions"
          value={props.totalPositions.toString()}
        />
        <FreezeButton />
      </div>
      <SearchBar className="drop-shadow-lg mb-12" />
      <div className="mb-1.5">
        <span className="float-left font-medium text-lg">
          Latest state updates
        </span>
        <SimpleLink className="float-right" href="/state-updates">
          view all
        </SimpleLink>
      </div>
      <Table
        noRowsText="no state updates have occurred so far"
        className="mb-8"
        columns={[
          { header: 'No.' },
          {
            header: 'Hash',
            cellFontMono: true,
            maxWidthClass: 'max-w-[320px]',
          },
          { header: 'Time' },
          { header: 'Position updates', numeric: true },
        ]}
        rows={props.stateUpdates.map((update) => {
          const link = `/state-updates/${update.id}`
          return {
            link,
            cells: [
              update.id.toString(),
              formatHash(update.hash),
              formatTime(update.timestamp),
              update.positionCount.toString(),
            ],
          }
        })}
      />
      <div className="mb-1.5">
        <span className="float-left font-medium text-lg">
          Latest forced transactions
        </span>
        <SimpleLink className="float-right" href="/forced-transactions">
          view all
        </SimpleLink>
      </div>
      <Table
        noRowsText="no forced transactions have been issued so far"
        columns={[
          { header: 'Type' },
          { header: 'Time' },
          { header: 'Status' },
          {
            header: 'Hash',
            cellFontMono: true,
            maxWidthClass: 'max-w-[250px]',
          },
          { header: 'Amount', numeric: true },
          { header: 'Asset' },
          { header: 'Position ID', numeric: true },
        ]}
        rows={props.forcedTransactions.map((transaction) => {
          const link = `/forced-transactions/${transaction.hash}`
          return {
            link,
            cells: [
              transaction.type,
              formatTime(transaction.lastUpdate),
              transaction.status,
              formatHash(transaction.hash.toString()),
              formatLargeNumber(transaction.amount),
              <AssetNameCell assetId={transaction.assetId} />,
              transaction.positionId.toString(),
            ],
          }
        })}
      />
    </Page>
  )
}
