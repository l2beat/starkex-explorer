import isNumber from 'lodash/isNumber'
import React, { ReactNode } from 'react'

import { formatInt } from '../../../utils/formatting/formatAmount'
import { Button } from '../Button'
import { Link } from '../Link'
import { SectionHeading } from '../SectionHeading'

interface TablePreviewProps {
  title: ReactNode
  path: string
  entryShortNamePlural: string
  entryLongNamePlural: string
  visible: number
  total: number | 'processing'
  children: ReactNode
}

export function TablePreview(props: TablePreviewProps) {
  return (
    <section>
      <SectionHeading
        title={props.title}
        description={
          props.total !== 'processing' &&
          props.total > 0 && (
            <>
              You're viewing {formatInt(props.visible)} out of{' '}
              <Link href={props.path}>{formatInt(props.total)}</Link>{' '}
              {props.entryShortNamePlural}
            </>
          )
        }
      />
      {props.children}
      {props.visible === 0 && (
        <div className="group-[.Card]:bg-gray-900 flex h-20 items-center justify-center rounded bg-transparent text-center text-md text-zinc-500">
          {props.total === 'processing'
            ? `${props.entryLongNamePlural} are being processed...`
            : `There are no ${props.entryLongNamePlural} to view.`}
        </div>
      )}
      {isNumber(props.total) && props.total > props.visible && (
        <div className="mt-6 flex items-center justify-center">
          <Button as="a" variant="outlined" href={props.path}>
            View all {props.entryLongNamePlural}
          </Button>
        </div>
      )}
    </section>
  )
}
