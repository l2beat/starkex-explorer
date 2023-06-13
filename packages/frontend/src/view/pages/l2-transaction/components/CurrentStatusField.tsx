import React from 'react'

import { Link } from '../../../components/Link'
import { StatusBadge } from '../../../components/StatusBadge'
import { getL2TransactionStatusBadgeValues } from '../common'

export function CurrentStatusField(props: {
  stateUpdateId: number | undefined
}) {
  const statusBadgeValues = getL2TransactionStatusBadgeValues(
    props.stateUpdateId
  )
  return (
    <div className="flex items-center gap-1">
      <StatusBadge type={statusBadgeValues.type}>
        {statusBadgeValues.text}
      </StatusBadge>
      {props.stateUpdateId !== undefined ? (
        <span>
          Transaction included in state update{' '}
          <Link href={`/state-updates/${props.stateUpdateId}`}>
            #{props.stateUpdateId}
          </Link>
        </span>
      ) : (
        'Transaction created'
      )}
    </div>
  )
}
