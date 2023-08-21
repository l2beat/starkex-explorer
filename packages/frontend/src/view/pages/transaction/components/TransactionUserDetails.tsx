import { TradingMode } from '@explorer/shared'
import { EthereumAddress, StarkKey } from '@explorer/types'
import React from 'react'

import { EtherscanLink } from '../../../components/EtherscanLink'
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
  chainId: number
}

export function TransactionUserDetails(props: TransactionUserDetailsProps) {
  return (
    <section>
      <SectionHeading title={props.title} />
      <div className="flex flex-col justify-between gap-4 rounded-lg bg-gray-800 p-6 font-semibold sm:flex-row sm:items-center sm:gap-8">
        {props.vaultOrPositionId && (
          <TransactionField
            label={props.tradingMode === 'perpetual' ? 'Position' : 'Vault'}
          >
            #{props.vaultOrPositionId}
          </TransactionField>
        )}
        <TransactionField label="Stark key">
          <Link href={`/users/${props.starkKey.toString()}`}>
            <InlineEllipsis className="max-w-[200px]">
              {props.starkKey.toString()}
            </InlineEllipsis>
          </Link>
        </TransactionField>
        <TransactionField label="Ethereum address">
          {props.ethereumAddress ? (
            <EtherscanLink
              chainId={props.chainId}
              type="address"
              address={props.ethereumAddress.toString()}
            >
              <InlineEllipsis className="max-w-[200px]">
                {props.ethereumAddress.toString()}
              </InlineEllipsis>
            </EtherscanLink>
          ) : (
            'Unknown'
          )}
        </TransactionField>
      </div>
    </section>
  )
}
