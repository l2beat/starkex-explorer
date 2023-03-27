import { TradingMode } from '@explorer/shared'
import { EthereumAddress, StarkKey } from '@explorer/types'
import React from 'react'

import { InlineEllipsis } from '../../../components/InlineEllipsis'
import { Link } from '../../../components/Link'
import { SectionHeading } from '../../../components/SectionHeading'
import { TransactionField } from './TransactionField'

interface TransactionUserDetailsProps {
  title: string
  tradingMode?: TradingMode
  ethereumAddress: EthereumAddress | undefined
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
            label={props.tradingMode === 'perpetual' ? 'Position' : 'Vault'}
          >
            #{props.vaultOrPositionId}
          </TransactionField>
        )}
        <TransactionField label="Stark Key">
          <Link href={`/users/${props.starkKey.toString()}`}>
            <InlineEllipsis className="max-w-[300px]">
              {props.starkKey.toString()}
            </InlineEllipsis>
          </Link>
        </TransactionField>
        <TransactionField label="Ethereum Address">
          {props.ethereumAddress ? (
            <Link
              href={`https://etherscan.io/address/${props.ethereumAddress.toString()}`}
            >
              <InlineEllipsis className="max-w-[300px]">
                {props.ethereumAddress.toString()}
              </InlineEllipsis>
            </Link>
          ) : (
            'Unknown'
          )}
        </TransactionField>
      </div>
    </section>
  )
}
