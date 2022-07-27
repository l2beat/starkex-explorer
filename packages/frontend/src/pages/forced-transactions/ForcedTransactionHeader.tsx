import React from 'react'

import { PageHeading } from '../common/header/PageHeading'

export interface ForcedTransactionHeaderProps {
  title: string
  children: React.ReactNode
}

export function ForcedTransactionHeader(props: ForcedTransactionHeaderProps) {
  return (
    <div className="mb-8 truncate flex justify-between content-center">
      <PageHeading>{props.title}</PageHeading>
      {props.children}
    </div>
  )
}
