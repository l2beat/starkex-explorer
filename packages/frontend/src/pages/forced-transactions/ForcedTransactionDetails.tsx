import { AssetId } from '@explorer/types'
import React from 'react'

import { Page } from '../common'
import { PageHeaderStats } from '../common/PageHeaderStats'
import { SimpleLink } from '../common/SimpleLink'
import {
  formatCurrency,
  formatHashLong,
  formatHashShort,
  formatTimestamp,
} from '../formatting'
import {
  ForcedTransactionDetailsProps,
  TransactionStatusEntry,
} from './ForcedTransactionDetailsProps'

export function ForcedTransactionDetails({
  account,
  history,
  ethereumAddress,
  positionId,
  transactionHash,
  value,
  stateUpdateId,
}: ForcedTransactionDetailsProps) {
  return (
    <Page
      title="L2BEAT dYdX Explorer"
      description="Site under construction"
      url="https://dydx.l2beat.com"
      image="/images/under-construction.png"
      stylesheets={['/styles/main.css']}
      scripts={['/scripts/main.js']}
      account={account}
    >
      <h1 className="font-sans font-bold text-2xl mb-12 overflow-x-hidden text-ellipsis whitespace-nowrap">
        Forced exit {formatHashShort(transactionHash)}
      </h1>
      <div className="mb-1.5 font-medium text-lg text-left">Stats</div>
      <PageHeaderStats
        rows={[
          {
            title: 'Position id',
            content: (
              <SimpleLink href={`/positions/${positionId}`}>
                #{positionId.toString()}
              </SimpleLink>
            ),
          },
          {
            title: 'Ethereum address',
            content: ethereumAddress?.toString() || '-',
          },
          {
            title: 'Value',
            content: formatCurrency(value, AssetId.USDC),
          },
          {
            title: 'Transaction hash',
            content: formatHashLong(transactionHash),
          },
          {
            title: 'State update id',
            content: stateUpdateId ? (
              <SimpleLink href={`/state-updates/${stateUpdateId}`}>
                #{stateUpdateId.toString()}
              </SimpleLink>
            ) : (
              '-'
            ),
          },
        ]}
      />
      <div className="mb-1.5 font-medium text-lg text-left">History</div>
      <div className="w-full overflow-x-auto mb-12">
        <table className="whitespace-nowrap w-full">
          {history.map((event, i) => (
            <tr className="bg-grey-200 border-2 border-grey-100" key={i}>
              <th className="font-normal text-left w-[268px] py-2 px-1.5">
                {formatTimestamp(event.timestamp)}
              </th>
              <td className="font-normal first-letter:capitalize py-2 px-1.5">
                {getStatusText(event)}
              </td>
            </tr>
          ))}
        </table>
      </div>
    </Page>
  )
}

function getStatusText(entry: TransactionStatusEntry): string {
  switch (entry.type) {
    case 'sent':
      return 'transaction sent'
    case 'mined':
      return 'transaction mined (waiting for inclusion in state update)'
    case 'verified':
      return `exit included in state update #${entry.stateUpdateId}`
  }
}
