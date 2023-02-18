import React, { ReactNode } from 'react'

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
          You are viewing {props.visible} out of{' '}
          <a className="text-blue-600 underline" href={props.link}>
            {props.total}
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
