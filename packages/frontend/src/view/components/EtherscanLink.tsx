import { assertUnreachable } from '@explorer/shared'
import React from 'react'

import { Link } from './Link'

type EtherscanLinkProps = {
  chainId: number
  children: React.ReactNode
  className?: string
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
  const link = getLink(props.chainId)
  const value = getValue(props)
  return (
    <Link href={`${link}/${props.type}/${value}`} className={props.className}>
      {props.children}
    </Link>
  )
}

function getLink(chainId: number): `https://${string}` {
  switch (chainId) {
    case 1:
      return 'https://etherscan.io'
    case 5:
      return 'https://goerli.etherscan.io'
    default:
      throw new Error(`Unsupported chain id: ${chainId}`)
  }
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
