import classNames from 'classnames'
import React from 'react'

import { Card } from '../../../components/Card'
import { SectionHeading } from '../../../components/SectionHeading'

interface HomeStatisticsProps {
  statistics: StatisticsEntry
  showL2Transactions: boolean
  className?: string
}

export interface StatisticsEntry {
  stateUpdateCount: number
  l2TransactionCount: number
  forcedTransactionCount: number
  offerCount: number
}

export function HomeStatistics({
  className,
  statistics,
  showL2Transactions,
}: HomeStatisticsProps) {
  return (
    <div className={classNames('flex flex-col', className)}>
      <SectionHeading title="Statistics" />
      <Card
        className={classNames(
          'grid h-full grid-cols-1 divide-y-2 divide-slate-800 !px-0',
          showL2Transactions
            ? 'md:grid-cols-2'
            : 'md:grid-cols-3 md:divide-x-2 md:divide-y-0'
        )}
      >
        <StatisticsItem
          title="State updates"
          value={statistics.stateUpdateCount}
        />
        {showL2Transactions && (
          <>
            <StatisticsItem
              title="Live transactions"
              className="pt-5 md:!border-t-0 md:pt-0"
              value={statistics.l2TransactionCount}
            />
          </>
        )}
        <StatisticsItem
          title="Forced transactions"
          className={classNames(
            showL2Transactions ? 'pt-5' : 'pt-5 md:!border-t-0 md:pt-0'
          )}
          value={statistics.forcedTransactionCount}
        />
        <StatisticsItem
          title="Offers"
          className={classNames(showL2Transactions ? 'pt-5' : 'pt-5 md:pt-0')}
          value={statistics.offerCount}
        />
      </Card>
    </div>
  )
}

function StatisticsItem({
  title,
  value,
  className,
}: {
  title: string
  value: number
  className?: string
}) {
  return (
    <div
      className={classNames(
        'flex flex-col justify-center text-center',
        className
      )}
    >
      <div className="text-gray-400 text-lg font-medium">{title}</div>
      <div className="text-bold text-[50px] text-brand">{value}</div>
    </div>
  )
}
