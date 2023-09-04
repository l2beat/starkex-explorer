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
          'grid h-full grid-cols-1 divide-y-2 divide-slate-800 md:grid-cols-3 md:divide-x-2 md:divide-y-0'
        )}
      >
        <StatisticsItem
          title="State updates"
          value={statistics.stateUpdateCount}
          className="pb-6 md:pb-0"
        />
        {showL2Transactions && (
          <StatisticsItem
            title="Transactions"
            className="py-6 md:!border-t-0 md:py-0"
            value={statistics.l2TransactionCount}
          />
        )}
        <StatisticsItem
          title="Forced transactions"
          className={classNames(
            'md:!border-t-0',
            showL2Transactions && 'pt-6 md:pt-0',
            !showL2Transactions && 'py-6 md:py-0'
          )}
          value={statistics.forcedTransactionCount}
        />
        {!showL2Transactions && (
          <StatisticsItem
            title="Offers"
            className="pt-6 md:pt-0"
            value={statistics.offerCount}
          />
        )}
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
        'flex flex-col items-center justify-between gap-4 text-center leading-none',
        className
      )}
    >
      <span className="text-[18px] font-semibold md:text-[20px]">{title}</span>
      <span className="text-[40px] font-extrabold text-brand md:text-[50px]">
        {formatStatisticsCount(value)}
      </span>
      <span className="hidden text-sm font-semibold text-zinc-500 md:inline">
        # of all {title.toLowerCase()}
      </span>
    </div>
  )
}

function formatStatisticsCount(count: number) {
  if (count < 1000000) {
    return count.toString()
  }

  return `${(count / 1000000).toFixed(2)}M`
}
