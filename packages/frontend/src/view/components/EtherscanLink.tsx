import { assertUnreachable } from '@explorer/shared'
import React from 'react'

import { Link } from './Link'

type EtherscanLinkProps = {
  children: React.ReactNode
} & (
  | {
      address: string
      type: 'address'
    }
  | {
      txHash: string
      type: 'tx'
    }
  | {
      blockNumber: number
      type: 'block'
    }
)

export function EtherscanLink(props: EtherscanLinkProps) {
  const value = getValue(props)
  return (
    <Link href={`https://etherscan.io/${props.type}/${value}`}>
      {props.children}
    </Link>
  )
}

function getValue(props: EtherscanLinkProps) {
  switch (props.type) {
    case 'address':
      return props.address
    case 'tx':
      return props.txHash
    case 'block':
      return props.blockNumber
    default:
      assertUnreachable(props)
  }
}
