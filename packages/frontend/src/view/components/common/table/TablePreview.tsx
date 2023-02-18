import React from 'react'

import { LinkButton } from '../Button'

export interface TablePreviewProps {
  title: string
  link: string
  entryShortNamePlural: string
  entryLongNamePlural: string
  visibleEntries: number
  totalEntries: number
  children: React.ReactNode
}

export function TablePreview(props: TablePreviewProps) {
  return (
    <section>
      <div className="mb-5 flex items-baseline justify-between">
        <h2 className="text-xl font-semibold">{props.title}</h2>
        <p className="text-sm font-medium text-zinc-500">
          You are viewing {props.visibleEntries} out of{' '}
          <a className="text-blue-600 underline" href={props.link}>
            {props.totalEntries}
          </a>{' '}
          {props.entryShortNamePlural}
        </p>
      </div>
      {props.children}
      <div className="mt-6 flex items-center justify-center">
        <LinkButton variant="outlined" href={props.link}>
          View all {props.entryLongNamePlural}
        </LinkButton>
      </div>
    </section>
  )
}
