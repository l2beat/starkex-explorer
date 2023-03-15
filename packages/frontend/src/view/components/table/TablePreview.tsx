import React, { ReactNode } from 'react'

import { formatInt } from '../../../utils/formatting/formatAmount'
import { LinkButton } from '../Button'
import { Link } from '../Link'
import { SectionHeading } from '../SectionHeading'

export interface TablePreviewProps {
  title: ReactNode
  path: string
  entryShortNamePlural: string
  entryLongNamePlural: string
  visible: number
  total: number
  children: ReactNode
}

export function TablePreview(props: TablePreviewProps) {
  return (
    <section>
      <SectionHeading
        title={props.title}
        description={
          <>
            You're viewing {formatInt(props.visible)} out of{' '}
            {props.total > 0 ? (
              <Link href={props.path}>{formatInt(props.total)}</Link>
            ) : (
              formatInt(props.total)
            )}{' '}
            {props.entryShortNamePlural}
          </>
        }
      />
      {props.children}
      {props.visible === 0 && (
        <div className="flex h-10 items-center justify-center text-center text-md text-zinc-500">
          There are no {props.entryLongNamePlural} to view.
        </div>
      )}
      {props.total > props.visible && (
        <div className="mt-6 flex items-center justify-center">
          <LinkButton variant="outlined" href={props.path}>
            View all {props.entryLongNamePlural}
          </LinkButton>
        </div>
      )}
    </section>
  )
}
