import React, { ReactNode } from 'react'

import { ArrowRightIcon } from '../../assets/icons/ArrowIcon'
import { Button } from '../Button'
import { Link } from '../Link'
import { SectionHeading } from '../SectionHeading'

interface TablePreviewProps {
  title?: ReactNode
  path: string
  entryShortNamePlural: string
  entryLongNamePlural: string
  visible: number
  children: ReactNode
}

export function TablePreview({
  title,
  path,
  entryShortNamePlural,
  entryLongNamePlural,
  visible,
  children,
}: TablePreviewProps) {
  return (
    <div>
      {title && (
        <SectionHeading
          title={title}
          description={
            <Link
              className="!gap-0.5"
              href={path}
              accessoryRight={<ArrowRightIcon className="scale-90" />}
            >
              View all {entryShortNamePlural}
            </Link>
          }
        />
      )}
      {children}
      {visible === 0 && (
        <div className="flex h-20 items-center justify-center rounded bg-transparent text-center text-md text-zinc-500 group-[.Card]/card:bg-gray-900">
          There are no {entryLongNamePlural} to view.
        </div>
      )}
      {!title && (
        <div className="mt-6 flex items-center justify-center">
          <Button as="a" variant="outlined" href={path}>
            View all {entryLongNamePlural}
          </Button>
        </div>
      )}
    </div>
  )
}
