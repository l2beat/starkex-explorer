import classNames from 'classnames'
import React, { ReactNode } from 'react'

import { ChevronDownIcon } from '../assets/icons/ChevronIcon'
import { Button } from './Button'
import { Card } from './Card'

interface ExpandableContainerProps {
  visible: ReactNode
  expandedContent: ReactNode
  className?: string
  subject?: string
}

export function ExpandableContainer(props: ExpandableContainerProps) {
  const expandLabel = `View ${props.subject ?? 'more'}`
  const collapseLabel = `Hide ${props.subject ?? 'less'}`
  return (
    <div className="ExpandableContainer">
      <Card>
        <div>
          <div>{props.visible}</div>
        </div>
        <div
          className={classNames(
            'ExpandableContainer-Content max-h-0 overflow-hidden transition-max-height',
            props.className
          )}
        >
          {props.expandedContent}
        </div>
      </Card>
      <div className="mt-3 flex justify-center">
        <Button
          variant="outlined"
          className="ExpandableContainer-Toggle flex h-10 items-center justify-center"
          data-expand-label={expandLabel}
          data-collapse-label={collapseLabel}
        >
          <span className="ExpandableContainer-ToggleText">{expandLabel}</span>
          <ChevronDownIcon className="ExpandableContainer-ToggleArrow inline-block transition-transform" />
        </Button>
      </div>
    </div>
  )
}
