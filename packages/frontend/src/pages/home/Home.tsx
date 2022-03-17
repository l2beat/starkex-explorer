import React from 'react'
import { Page } from '../common'
import { SearchBar } from '../common/SearchBar'
import { HomeProps } from './HomeProps'
import { formatTime } from '../formatTime'
import { formatHash } from '../formatHash'
import { Table } from '../common/Table'
import { SimpleLink } from '../common/SimpleLink'
import { FreezeButton } from '../common/FreezeButton'

const stats = [
  { title: 'Total Value Locked', value: '$5.24B' },
  { title: 'State updates', value: '5143' },
  { title: 'Tracked positions', value: '45,762' },
]

const Stat = ({ title, value }: { title: string; value: string }) => {
  return (
    <div className="py-2 px-4 bg-grey-300 rounded-md w-[25%]">
      <div className="w-full mb-2">{title}</div>
      <div className="font-sans font-bold text-2xl w-full text-right">
        {value}
      </div>
    </div>
  )
}

export function Home(props: HomeProps) {
  return (
    <Page
      title="L2BEAT dYdX Explorer"
      description="Site under construction"
      url="https://dydx.l2beat.com"
      image="/images/under-construction.png"
      stylesheets={['/styles/main.css']}
      scripts={['/scripts/main.js']}
      withoutSearch
    >
      <div className="mb-12 flex gap-x-4 items-center">
        {stats.map(({ title, value }) => (
          <Stat key={title} title={title} value={value} />
        ))}
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
        columns={[
          { header: 'No.' },
          { header: 'Hash', cellFontMono: true, maxWidth: true },
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
    </Page>
  )
}
