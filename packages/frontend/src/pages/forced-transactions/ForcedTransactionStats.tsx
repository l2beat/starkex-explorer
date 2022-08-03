import { AssetId } from '@explorer/types'
import React from 'react'

import { EtherscanLink } from '../common/EtherscanLink'
import { SimpleLink } from '../common/SimpleLink'
import { StatsTable } from '../common/table/StatsTable'
import { formatCurrency, formatHashLong } from '../formatting'
import { getForcedTradeOfferStatRows } from '../offers/ForcedTradeOfferStats'
import { ForcedTransaction } from './ForcedTransactionDetailsProps'

export interface ForcedTransactionStatsProps {
  transaction: ForcedTransaction
}

export function ForcedTransactionStats({
  transaction,
}: ForcedTransactionStatsProps) {
  return <StatsTable rows={getForcedTransactionStatRows(transaction)} />
}

function getForcedTransactionStatRows(transaction: ForcedTransaction) {
  const rows = []

  if (transaction.type === 'exit') {
    rows.push({
      title: 'Position',
      content: (
        <SimpleLink href={`/positions/${transaction.data.positionId}`}>
          {transaction.data.positionId.toString()}
        </SimpleLink>
      ),
    })
  }

  if (transaction.type === 'exit' && transaction.data.ethereumAddress) {
    rows.push({
      title: 'Ethereum address',
      content: (
        <EtherscanLink address={transaction.data.ethereumAddress}>
          {transaction.data.ethereumAddress}
        </EtherscanLink>
      ),
    })
  }

  if (transaction.type === 'exit') {
    rows.push({
      title: 'Stark key',
      content: formatHashLong(transaction.data.starkKey),
    })
  }

  if (transaction.type === 'exit') {
    rows.push({
      title: 'Value',
      content: formatCurrency(transaction.data.value, AssetId.USDC),
    })
  }

  if (transaction.type !== 'exit') {
    rows.push(...getForcedTradeOfferStatRows(transaction.data))
  }

  rows.push({
    title: 'Transaction hash',
    content: (
      <EtherscanLink transaction={transaction.data.transactionHash}>
        {formatHashLong(transaction.data.transactionHash)}
      </EtherscanLink>
    ),
  })

  if (transaction.data.stateUpdateId) {
    rows.push({
      title: 'State update',
      content: (
        <SimpleLink href={`/state-updates/${transaction.data.stateUpdateId}`}>
          {transaction.data.stateUpdateId.toString()}
        </SimpleLink>
      ),
    })
  }

  if (transaction.type === 'exit' && transaction.data.finalizeHash) {
    rows.push({
      title: 'Finalize transaction hash',
      content: (
        <EtherscanLink transaction={transaction.data.finalizeHash}>
          {formatHashLong(transaction.data.finalizeHash)}
        </EtherscanLink>
      ),
    })
  }

  return rows
}
