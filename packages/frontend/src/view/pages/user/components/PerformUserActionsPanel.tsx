import { PageContext } from '@explorer/shared'
import { StarkKey } from '@explorer/types'
import React from 'react'

import { WarningIcon } from '../../../assets/icons/WarningIcon'
import { Button } from '../../../components/Button'
import { Card } from '../../../components/Card'

interface PerformUserActionsPanelProps {
  starkKey: StarkKey
  performUserActions?: boolean
  context: PageContext
}

export function PerformUserActionsPanel(props: PerformUserActionsPanelProps) {
  const ownerIsAlreadyConnected =
    props.context.user?.starkKey === props.starkKey
  if (
    props.context.freezeStatus !== 'frozen' ||
    props.context.user === undefined ||
    ownerIsAlreadyConnected
  ) {
    return null
  }
  return !props.performUserActions ? (
    <section>
      <Card>
        <div className="flex flex-row gap-4">
          <p className="mb-1.5 flex-1 font-semibold">
            You are not connected to this user's wallet. You can enable Escape
            Hatch operations and pay their gas cost, but all withdrawals will go
            to this user's address, not yours.
          </p>
          <Button
            as="a"
            href="?performUserActions=true"
            className="w-48 leading-tight"
            size="lg"
          >
            Perform Actions for this User
          </Button>
        </div>
      </Card>
    </section>
  ) : (
    <section>
      <Card className="bg-warning">
        <div className="flex flex-row gap-4">
          <WarningIcon width="64" height="48" />
          <p className="mb-1.5 font-semibold">
            You are not connected to this user's wallet. You can still perform
            Escape Hatch operations for this user (and pay their gas costs) but
            all withdrawals will go to this user's address, not yours.
          </p>
        </div>
      </Card>
    </section>
  )
}
