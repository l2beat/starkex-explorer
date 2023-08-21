import React from 'react'

import { CopyIcon } from '../assets/icons/CopyIcon'
import { TooltipWrapper } from './Tooltip'

export function CopyButton({ content }: { content: string }) {
  return (
    <TooltipWrapper className="inline-flex" content="Copied!" onlyOnClick>
      <CopyIcon
        className="CopyButton transition-opacity hover:opacity-80"
        data-content={content}
      />
    </TooltipWrapper>
  )
}
