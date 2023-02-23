import { EthereumAddress, StarkKey } from '@explorer/types'
import React from 'react'

import { InlineEllipsis } from '../../../components/InlineEllipsis'
import { SectionHeading } from '../../../components/SectionHeading'
import { TransactionField } from './TransactionField'

interface TransactionUserDetailsProps {
  title: string
  type?: 'SPOT' | 'PERPETUAL'
  ethereumAddress: EthereumAddress
  starkKey: StarkKey
  vaultOrPositionId?: string
}

export function TransactionUserDetails(props: TransactionUserDetailsProps) {
  return (
    <section>
      <SectionHeading title={props.title} />
      <div className="flex items-center justify-between gap-8 rounded-lg bg-gray-800 p-6 font-semibold">
        {props.vaultOrPositionId && (
          <TransactionField
            label={props.type === 'SPOT' ? 'Vault' : 'Position'}
          >
            #{props.vaultOrPositionId}
          </TransactionField>
        )}
        <TransactionField label="Stark Key">
          <a href={`/users/${props.starkKey.toString()}`}>
            <InlineEllipsis className="max-w-[300px] text-blue-600 underline">
              {props.starkKey.toString()}
            </InlineEllipsis>
          </a>
        </TransactionField>
        <TransactionField label="Ethereum Address">
          <a
            href={`https://etherscan.io/address/${props.ethereumAddress.toString()}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <InlineEllipsis className="max-w-[300px] text-blue-600 underline">
              {props.ethereumAddress.toString()}
            </InlineEllipsis>
          </a>
        </TransactionField>
      </div>
    </section>
  )
}
