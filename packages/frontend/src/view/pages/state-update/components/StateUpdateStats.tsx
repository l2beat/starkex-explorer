import { PageContext } from '@explorer/shared'
import { Hash256, PedersenHash, Timestamp } from '@explorer/types'
import React, { ReactNode } from 'react'

import { formatTimestamp } from '../../../../utils/formatting/formatTimestamp'
import { EtherscanLink } from '../../../components/EtherscanLink'
import { ExpandableContainer } from '../../../components/ExpandableContainer'
import { InlineEllipsis } from '../../../components/InlineEllipsis'
import { Link } from '../../../components/Link'
import { PageTitle } from '../../../components/PageTitle'

export interface StateUpdateStatsProps {
  id: string
  transactionHash: Hash256
  hashes: {
    positionTreeRoot?: PedersenHash
    onChainVaultTreeRoot?: PedersenHash
    offChainVaultTreeRoot?: PedersenHash
    orderRoot?: PedersenHash
  }
  ethereumTimestamp: Timestamp
  starkExTimestamp: Timestamp
  rawDataAvailable?: boolean
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
      <ExpandableContainer
        visible={
          <div className="flex flex-col justify-between gap-6 sm:flex-row">
            <ValueItem label="Transaction hash">
              <EtherscanLink
                chainId={props.context.chainId}
                type="tx"
                txHash={props.transactionHash.toString()}
              >
                <InlineEllipsis className="max-w-[300px] sm:max-w-[250px] lg:max-w-md">
                  {props.transactionHash.toString()}
                </InlineEllipsis>
              </EtherscanLink>
            </ValueItem>
            <ValueItem label="Ethereum block timestamp">
              {formatTimestamp(props.ethereumTimestamp)} UTC
            </ValueItem>
          </div>
        }
        expandedContent={
          <div className="mt-8 flex flex-col gap-4 rounded bg-slate-800 p-6">
            {props.hashes.positionTreeRoot && (
              <ValueItem label="Position tree root">
                0x{props.hashes.positionTreeRoot.toString()}
              </ValueItem>
            )}
            {props.hashes.onChainVaultTreeRoot && (
              <ValueItem label="On-chain vault tree root">
                0x{props.hashes.onChainVaultTreeRoot.toString()}
              </ValueItem>
            )}
            {props.hashes.offChainVaultTreeRoot && (
              <ValueItem label="Off-chain vault tree root">
                0x{props.hashes.offChainVaultTreeRoot.toString()}
              </ValueItem>
            )}
            {props.hashes.orderRoot && (
              <ValueItem label="Order root">
                0x{props.hashes.orderRoot.toString()}
              </ValueItem>
            )}
            {props.rawDataAvailable && (
              <Link
                href={`/state-updates/${props.id}/raw`}
                className="text-lg font-semibold"
              >
                View raw data
              </Link>
            )}
          </div>
        }
        subject="advanced data"
      />
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
