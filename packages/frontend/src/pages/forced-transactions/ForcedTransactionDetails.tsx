import React from 'react'

import { Page } from '../common'
import { formatAbsoluteTime, formatHashShort } from '../formatting'
import {
  ForcedHistoryEntry,
  ForcedTransaction,
  ForcedTransactionDetailsProps,
} from './ForcedTransactionDetailsProps'
import { Stats } from './Stats'

function getHeaderText(props: ForcedTransaction): string {
  if (props.type === 'exit') {
    return `Forced exit ${formatHashShort(props.data.transactionHash)}`
  }
  const id =
    typeof props.data.displayId === 'number'
      ? `#${props.data.displayId}`
      : formatHashShort(props.data.displayId)
  return `Forced ${props.type} ${id}`
}

function getStatusText(
  entry: ForcedHistoryEntry,
  type: ForcedTransaction['type']
): string {
  const partyB = type === 'buy' ? 'buyer' : 'seller'
  switch (entry.type) {
    case 'created':
      return `offer created (looking for ${partyB})`
    case 'accepted':
      return `${partyB} found`
    case 'cancelled':
      return `offer cancelled`
    case 'expired':
      return `offer submission time has expired`
    case 'sent':
      return 'transaction sent'
    case 'mined':
      return 'transaction mined (waiting for inclusion in state update)'
    case 'verified':
      return `exit included in state update #${entry.stateUpdateId}`
    case 'reverted':
      return 'transaction reverted'
  }
}

export function ForcedTransactionDetails({
  account,
  history,
  transaction,
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
        {getHeaderText(transaction)}
      </h1>
      <Stats transaction={transaction} />
      <div className="mb-1.5 font-medium text-lg text-left">History</div>
      <div className="w-full overflow-x-auto mb-12">
        <table className="whitespace-nowrap w-full">
          {history.map((entry, i) => (
            <tr className="bg-grey-200 border-2 border-grey-100" key={i}>
              <th className="font-normal text-left w-[268px] py-2 px-1.5">
                {formatAbsoluteTime(entry.timestamp)}
              </th>
              <td className="font-normal first-letter:capitalize py-2 px-1.5">
                {getStatusText(entry, transaction.type)}
              </td>
            </tr>
          ))}
        </table>
      </div>
    </Page>
  )
}
