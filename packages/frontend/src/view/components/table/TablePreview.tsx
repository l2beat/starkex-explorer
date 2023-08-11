import React, { ReactNode } from 'react'

import { ArrowRightIcon } from '../../assets/icons/ArrowIcon'
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

export function TablePreview(props: TablePreviewProps) {
  return (
    <section>
      {props.title && (
        <SectionHeading
          title={props.title}
          description={
            <Link
              className="!gap-0.5"
              href={props.path}
              accessoryRight={<ArrowRightIcon className="scale-90" />}
            >
              View all {props.entryShortNamePlural}{' '}
            </Link>
          }
        />
      )}
      {props.children}
      {props.visible === 0 && (
        <div className="group-[.Card]/card:bg-gray-900 flex h-20 items-center justify-center rounded bg-transparent text-center text-md text-zinc-500">
          There are no {props.entryLongNamePlural} to view.
        </div>
      )}
    </section>
  )
}
