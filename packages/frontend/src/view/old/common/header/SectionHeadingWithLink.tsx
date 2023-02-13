import React, { ReactNode } from 'react'

import { SimpleLink } from '../SimpleLink'
import { SectionHeading } from './SectionHeading'

export interface SectionHeadingWithLinkProps {
  linkUrl: string
  linkText: ReactNode
  children?: ReactNode
}

export function SectionHeadingWithLink({
  linkUrl,
  linkText,
  children,
}: SectionHeadingWithLinkProps) {
  return (
    <div className="mb-1.5 flex items-baseline">
      <SectionHeading className="!mb-0 flex-1">{children}</SectionHeading>
      <SimpleLink className="float-right" href={linkUrl}>
        {linkText}
      </SimpleLink>
    </div>
  )
}
