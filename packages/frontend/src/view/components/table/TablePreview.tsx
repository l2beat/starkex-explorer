import React, { ReactNode } from 'react'

import { ArrowRightIcon } from '../../assets/icons/ArrowIcon'
import { Button } from '../Button'
import { Link } from '../Link'
import { SectionHeading } from '../SectionHeading'

type TablePreviewProps = {
  path: string
  entryLongNamePlural: string
  visible: number
  children: ReactNode
} & (
  | {
      title: string
      viewAllPosition: 'top'
    }
  | {
      viewAllPosition: 'bottom'
    }
)

export function TablePreview(props: TablePreviewProps) {
  return (
    <div>
      {props.viewAllPosition === 'top' && (
        <SectionHeading
          title={props.title}
          description={
            <>
              <Link
                className="flex !gap-0.5"
                href={props.path}
                accessoryRight={<ArrowRightIcon className="scale-90" />}
              >
                View all
              </Link>
            </>
          }
        />
      )}
      {props.children}
      {props.visible === 0 && (
        <div className="-mx-6 flex h-20 items-center justify-center rounded bg-gray-900 text-center text-md text-zinc-500 sm:mx-0">
          There are no {props.entryLongNamePlural} to view.
        </div>
      )}
      {props.viewAllPosition === 'bottom' && props.visible !== 0 && (
        <div className="mt-6 flex items-center justify-center">
          <Button as="a" variant="outlined" href={props.path}>
            View all {props.entryLongNamePlural}
          </Button>
        </div>
      )}
    </div>
  )
}
