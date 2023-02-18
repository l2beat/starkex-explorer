import React, { ReactNode } from 'react'
import { formatInt } from '../../../../utils/formatting/formatAmount'

import { LinkButton } from '../Button'

export interface TablePreviewProps {
  title: ReactNode
  link: string
  entryShortNamePlural: string
  entryLongNamePlural: string
  visible: number
  total: number
  children: ReactNode
}

export function TablePreview(props: TablePreviewProps) {
  return (
    <section>
      <div className="mb-5 flex items-baseline justify-between">
        <h2 className="text-xl font-semibold">{props.title}</h2>
        <p className="text-sm font-medium text-zinc-500">
          You are viewing {formatInt(props.visible)} out of{' '}
          <a className="text-blue-600 underline" href={props.link}>
            {formatInt(props.total)}
          </a>{' '}
          {props.entryShortNamePlural}
        </p>
      </div>
      {props.children}
      {props.visible === 0 && (
        <div className="flex h-10 items-center justify-center text-center text-md text-zinc-500">
          There are no {props.entryLongNamePlural} to view.
        </div>
      )}
      {props.total > props.visible && (
        <div className="mt-6 flex items-center justify-center">
          <LinkButton variant="outlined" href={props.link}>
            View all {props.entryLongNamePlural}
          </LinkButton>
        </div>
      )}
    </section>
  )
}
