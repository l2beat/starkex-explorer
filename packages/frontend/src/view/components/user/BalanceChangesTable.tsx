import { Timestamp } from '@explorer/types'
import cx from 'classnames'
import React from 'react'

import { Table } from '../common/table/Table'

export interface BalanceChangesTableProps {
  readonly balanceChanges: readonly BalanceChangeEntry[]
}
export interface BalanceChangeEntry {
  readonly timestamp: Timestamp
  readonly stateUpdateId: number
  readonly asset: string
  readonly assetIcon: string
  readonly newBalance: bigint
  readonly change: bigint
  readonly vaultId: number
}

export function BalanceChangesTable({
  balanceChanges,
}: BalanceChangesTableProps) {
  return (
    <Table
      pageSize={6}
      id="test"
      title="Balance changes"
      noRowsText="You have no balanceChanges"
      columns={[
        { header: 'TIME' },
        { header: 'STATE UPDATE ID' },
        { header: 'ASSET' },
        { header: 'BALANCE AFTER' },
        { header: 'CHANGE' },
        { header: 'VAULT ID' },
      ]}
      rows={balanceChanges.map((balanceChange) => {
        const link = `/balanceChanges/${balanceChange.asset}` //TODO: Construct a proper link
        const date = new Date(balanceChange.timestamp.valueOf())
        const positiveChange = balanceChange.change > 0
        return {
          link,
          cells: [
            `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`,
            <a
              href={`/stateUpdates/${balanceChange.stateUpdateId}`}
              className="text-blue-300 underline"
            >
              #{balanceChange.stateUpdateId}
            </a>,
            balanceChange.asset,
            balanceChange.newBalance.toString(),
            <p
              className={cx(
                'text-sm font-medium',
                { 'text-red-100': !positiveChange },
                { 'text-emerald-400': positiveChange }
              )}
            >{`${
              positiveChange ? '+' : '-'
            } ${balanceChange.change.toString()} ${balanceChange.asset}`}</p>,
            <p className="text-zinc-500">#{balanceChange.vaultId}</p>,
          ],
        }
      })}
    />
  )
}
