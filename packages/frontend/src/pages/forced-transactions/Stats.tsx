import { AssetId } from '@explorer/types'
import React from 'react'

import { PageHeaderStats } from '../common/PageHeaderStats'
import { SimpleLink } from '../common/SimpleLink'
import { formatCurrency, formatHashLong } from '../formatting'
import { ForcedTransaction } from './ForcedTransactionDetailsProps'

function getStatsRows(transaction: ForcedTransaction) {
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

  const partyA = transaction.type === 'buy' ? 'Buyer' : 'Seller'
  const partyB = transaction.type === 'buy' ? 'Seller' : 'Buyer'

  const base = [
    {
      title: `${partyA} position id`,
      content: (
        <SimpleLink href={`/positions/${transaction.data.positionIdA}`}>
          #{transaction.data.positionIdA.toString()}
        </SimpleLink>
      ),
    },
    {
      title: `${partyA} ethereum address`,
      content: transaction.data.addressA.toString(),
    },
    {
      title: 'Tokens sold',
      content: formatCurrency(
        transaction.data.amountSynthetic,
        transaction.data.assetId
      ),
    },
    {
      title: 'Value received',
      content: formatCurrency(transaction.data.amountCollateral, AssetId.USDC),
    },
  ]

  if (transaction.data.positionIdB) {
    base.push({
      title: `${partyB} position id`,
      content: (
        <SimpleLink href={`/positions/${transaction.data.positionIdB}`}>
          #{transaction.data.positionIdB.toString()}
        </SimpleLink>
      ),
    })
  }

  if (transaction.data.addressB) {
    base.push({
      title: `${partyB} ethereum address`,
      content: transaction.data.addressB.toString(),
    })
  }

  if (transaction.data.transactionHash) {
    base.push({
      title: `Transaction hash`,
      content: transaction.data.transactionHash.toString(),
    })
  }

  return base
}

interface StatsProps {
  transaction: ForcedTransaction
}

export function Stats({ transaction }: StatsProps) {
  return (
    <>
      <div className="mb-1.5 font-medium text-lg text-left">Stats</div>
      <PageHeaderStats rows={getStatsRows(transaction)} />
    </>
  )
}
