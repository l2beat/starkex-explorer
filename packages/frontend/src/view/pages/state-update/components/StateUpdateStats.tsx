import { PageContext } from '@explorer/shared'
import { Hash256, PedersenHash, Timestamp } from '@explorer/types'
import React, { ReactNode } from 'react'

import { formatTimestamp } from '../../../../utils/formatting/formatTimestamp'
import { Card } from '../../../components/Card'
import { EtherscanLink } from '../../../components/EtherscanLink'
import { InlineEllipsis } from '../../../components/InlineEllipsis'
import { LongHash } from '../../../components/LongHash'
import { PageTitle } from '../../../components/PageTitle'

export interface StateUpdateStatsProps {
  id: string
  transactionHash: Hash256
  balancesTreeRootHash: PedersenHash
  ethereumTimestamp: Timestamp
  starkExTimestamp: Timestamp
  context: PageContext
}

export function StateUpdateStats(props: StateUpdateStatsProps) {
  // Disabled until StarkEx timestamp will be fixed
  // const delayHours = Math.max(
  //   Math.floor(
  //     (Number(props.ethereumTimestamp) - Number(props.starkExTimestamp)) /
  //       (60 * 60 * 1000)
  //   ),
  //   0
  // )

  return (
    <section>
      <PageTitle>State Update #{props.id}</PageTitle>
      <Card>
        <div>
          <div className="flex flex-col justify-between gap-6 sm:flex-row">
            <ValueItem label="Transaction hash">
              <EtherscanLink
                chainId={props.context.chainId}
                type="tx"
                txHash={props.transactionHash.toString()}
              >
                <InlineEllipsis className="max-w-[280px] sm:max-w-[250px] lg:max-w-md">
                  {props.transactionHash.toString()}
                </InlineEllipsis>
              </EtherscanLink>
            </ValueItem>
            <ValueItem label="Ethereum block timestamp">
              {formatTimestamp(props.ethereumTimestamp)} UTC
            </ValueItem>
          </div>
          <div className="mt-8 flex flex-col">
            <ValueItem label="Balances tree root">
              <LongHash withCopy>
                0x{props.balancesTreeRootHash.toString()}
              </LongHash>
            </ValueItem>
          </div>
        </div>
      </Card>
    </section>
  )
}

interface ValueItemProps {
  label: string
  children: ReactNode
}

function ValueItem({ label, children }: ValueItemProps) {
  return (
    <div>
      <div className="text-sm font-semibold text-zinc-500">{label}</div>
      <div className="mt-2 text-lg font-semibold">{children}</div>
    </div>
  )
}
