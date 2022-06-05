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
    <div className="flex items-baseline mb-1.5">
      <SectionHeading className="flex-1 !mb-0">{children}</SectionHeading>
      <SimpleLink className="float-right" href={linkUrl}>
        {linkText}
      </SimpleLink>
    </div>
  )
}
