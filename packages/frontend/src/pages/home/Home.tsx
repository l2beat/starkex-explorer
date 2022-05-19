import { AssetId } from '@explorer/types'
import React from 'react'

import { Page } from '../common'
import { AssetCell } from '../common/AssetNameCell'
import { SearchBar } from '../common/SearchBar'
import { SimpleLink } from '../common/SimpleLink'
import { Table } from '../common/table'
import {
  formatCurrencyUnits,
  formatHashLong,
  formatRelativeTime,
} from '../formatting'
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
          { header: 'Hash', monospace: true, fullWidth: true },
          { header: 'Time' },
          { header: 'Position updates', numeric: true },
        ]}
        rows={props.stateUpdates.map((update) => {
          const link = `/state-updates/${update.id}`
          return {
            link,
            cells: [
              update.id.toString(),
              formatHashLong(update.hash),
              formatRelativeTime(update.timestamp),
              update.positionCount.toString(),
            ],
          }
        })}
      />
      <div className="mb-1.5">
        <span className="float-left font-medium text-lg">
          Latest forced transactions
        </span>
        <SimpleLink className="float-right" href="/forced">
          view all
        </SimpleLink>
      </div>
      <Table
        noRowsText="no forced transactions have been issued so far"
        className="mb-8"
        columns={[
          { header: 'Type' },
          { header: 'Time' },
          { header: 'Status' },
          { header: 'Hash', monospace: true, fullWidth: true },
          { header: 'Amount', numeric: true },
          { header: 'Asset' },
          { header: 'Position ID', numeric: true },
        ]}
        rows={props.forcedTransactions.map((transaction) => {
          const link = `/forced/${transaction.hash}`
          return {
            link,
            cells: [
              transaction.type,
              formatRelativeTime(transaction.lastUpdate),
              transaction.status,
              formatHashLong(transaction.hash),
              formatCurrencyUnits(transaction.amount, transaction.assetId),
              <AssetCell assetId={transaction.assetId} />,
              transaction.positionId.toString(),
            ],
          }
        })}
      />
      <div className="mb-1.5">
        <span className="float-left font-medium text-lg">
          Latest forced trade offers
        </span>
        <SimpleLink className="float-right" href="/forced/offers">
          view all
        </SimpleLink>
      </div>
      <Table
        noRowsText="there is no active offers at the moment"
        columns={[
          { header: 'Type' },
          {
            header: 'Asset',
            numeric: true,
            textAlignClass: 'text-left',
            fullWidth: true,
          },
          { header: 'Price', numeric: true },
          { header: 'Total', numeric: true },
          { header: 'Position ID', numeric: true },
        ]}
        rows={props.forcedTradeOffers.map((offer) => {
          const link = `/forced/offers/${offer.id}`
          return {
            link,
            cells: [
              offer.type,
              <AssetCell assetId={offer.assetId} amount={offer.amount} />,
              formatCurrencyUnits(offer.price, 'USD'),
              formatCurrencyUnits(offer.total, AssetId.USDC),
              offer.positionId.toString(),
            ],
          }
        })}
      />
    </Page>
  )
}
