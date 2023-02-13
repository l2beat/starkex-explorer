import React from 'react'

import { PageHeading } from '../common/header/PageHeading'

export interface ForcedTransactionHeaderProps {
  title: string
  children: React.ReactNode
}

export function ForcedTransactionHeader(props: ForcedTransactionHeaderProps) {
  return (
    <div className="mb-8 flex content-center justify-between truncate">
      <PageHeading>{props.title}</PageHeading>
      {props.children}
    </div>
  )
}
