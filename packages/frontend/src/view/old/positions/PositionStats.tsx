import { EthereumAddress, StarkKey, Timestamp } from '@explorer/types'
import React from 'react'

import { EtherscanLink } from '../common/EtherscanLink'
import { SimpleLink } from '../common/SimpleLink'
import { StatsTable } from '../common/table/StatsTable'
import { formatAbsoluteTime, formatHashLong } from '../formatting'

export interface PositionStatsProps {
  ethAddress?: EthereumAddress
  starkKey: StarkKey
  stateUpdateId: number
  lastUpdateTimestamp: Timestamp
}

export function PositionStats(props: PositionStatsProps) {
  return <StatsTable rows={getPositionStatRows(props)} />
}

function getPositionStatRows(props: PositionStatsProps) {
  const rows = []

  if (props.ethAddress) {
    rows.push({
      title: 'Ethereum address',
      content: (
        <EtherscanLink address={props.ethAddress}>
          {props.ethAddress}
        </EtherscanLink>
      ),
    })
  }

  rows.push({
    title: 'Stark key',
    content: formatHashLong(props.starkKey),
  })

  rows.push({
    title: 'Last state update',
    content: (
      <SimpleLink href={`/state-updates/${props.stateUpdateId}`}>
        {props.stateUpdateId}
      </SimpleLink>
    ),
  })

  rows.push({
    title: 'Last update timestamp',
    content: formatAbsoluteTime(props.lastUpdateTimestamp),
    fontRegular: true,
  })

  return rows
}
