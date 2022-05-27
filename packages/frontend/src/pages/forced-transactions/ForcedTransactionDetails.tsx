import { AssetId } from '@explorer/types'
import React from 'react'

import { Page } from '../common'
import { ForcedHistory } from '../common/ForcedHistory'
import { PageHeaderStats } from '../common/PageHeaderStats'
import { SimpleLink } from '../common/SimpleLink'
import { formatCurrency, formatHashLong, formatHashShort } from '../formatting'
import { toStatsRows as toOfferStatsRows } from '../offers/ForcedTradeOfferDetails'
import {
  ForcedTransaction,
  ForcedTransactionDetailsProps,
} from './ForcedTransactionDetailsProps'

function toHeaderText(props: ForcedTransaction): string {
  if (props.type === 'exit') {
    return `Forced exit ${formatHashShort(props.data.transactionHash)}`
  }
  const id =
    typeof props.data.displayId === 'number'
      ? `#${props.data.displayId}`
      : formatHashShort(props.data.displayId)
  return `Forced ${props.type} ${id}`
}

function toStatsRows(transaction: ForcedTransaction) {
  if (transaction.type === 'exit') {
    return [
      {
        title: 'Position id',
        content: (
          <SimpleLink href={`/positions/${transaction.data.positionId}`}>
            #{transaction.data.positionId.toString()}
          </SimpleLink>
        ),
      },
      {
        title: 'Ethereum address',
        content: transaction.data.ethereumAddress?.toString() || '-',
      },
      {
        title: 'Value',
        content: formatCurrency(transaction.data.value, AssetId.USDC),
      },
      {
        title: 'Transaction hash',
        content: formatHashLong(transaction.data.transactionHash),
      },
      {
        title: 'State update id',
        content: transaction.data.stateUpdateId ? (
          <SimpleLink href={`/state-updates/${transaction.data.stateUpdateId}`}>
            #{transaction.data.stateUpdateId.toString()}
          </SimpleLink>
        ) : (
          '-'
        ),
      },
    ]
  }

  return [
    ...toOfferStatsRows({ type: transaction.type, ...transaction.data }),
    {
      title: `Transaction hash`,
      content: transaction.data.transactionHash.toString(),
    },
  ]
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
        {toHeaderText(transaction)}
      </h1>
      <div className="mb-1.5 font-medium text-lg text-left">Stats</div>
      <PageHeaderStats rows={toStatsRows(transaction)} />
      <ForcedHistory events={history} />
    </Page>
  )
}
