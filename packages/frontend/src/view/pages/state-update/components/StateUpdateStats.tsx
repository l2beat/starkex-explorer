import { PageContext } from '@explorer/shared'
import { Hash256, PedersenHash, Timestamp } from '@explorer/types'
import React, { ReactNode } from 'react'

import { formatTimestamp } from '../../../../utils/formatting/formatTimestamp'
import {
  ChevronDownIcon,
  ChevronUpIcon,
} from '../../../assets/icons/ChevronIcon'
import { Button } from '../../../components/Button'
import { EtherscanLink } from '../../../components/EtherscanLink'
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
    <section data-component="StateUpdateStats">
      <PageTitle>State Update #{props.id}</PageTitle>
      <div className="mb-6 flex flex-col gap-6 rounded-lg bg-gray-800 p-6">
        <div className="flex flex-col justify-between gap-6 sm:flex-row">
          <ValueItem label="Transaction hash">
            <EtherscanLink
              chainId={props.context.chainId}
              type="tx"
              txHash={props.transactionHash.toString()}
            >
              <InlineEllipsis className="max-w-[250px] lg:max-w-md">
                {props.transactionHash.toString()}
              </InlineEllipsis>
            </EtherscanLink>
          </ValueItem>
          <ValueItem label="Ethereum block timestamp">
            {formatTimestamp(props.ethereumTimestamp)} UTC
          </ValueItem>

          {/* Disabled until StarkEx timestamp will be fixed
          <ValueItem label="StarkEx timestamp">
            {formatTimestamp(props.starkExTimestamp, 'utc')} UTC{' '}
            <span className="text-sm font-semibold text-zinc-500">
              ({delayHours}h delay)
            </span>
          </ValueItem> */}
        </div>
        <div className="hidden" data-component="StateUpdateStats-Advanced">
          <div className="flex flex-col gap-4 rounded bg-slate-800 p-6">
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
        </div>
      </div>
      <div className="flex justify-center">
        <Button
          variant="outlined"
          className="flex h-10 items-center justify-center"
        >
          View advanced data <ChevronDownIcon className="inline-block" />
          <ChevronUpIcon className="hidden" />
        </Button>
      </div>
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
