import { PageContext } from '@explorer/shared'
import { StarkKey } from '@explorer/types'
import React from 'react'

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
        <p className="mb-2 font-bold">
          Do you want to enable actions for this user?
        </p>
        <div className="flex gap-4 max-md:flex-col">
          <p className="flex-1 text-sm font-semibold leading-tight">
            You are not connected to this user's wallet. You can enable Escape
            Hatch operations and pay their gas cost, but all withdrawals will go
            to this user's address, not yours.
          </p>
          <Button
            as="a"
            href="?performUserActions=true"
            variant="outlined"
            className="w-full md:w-48"
          >
            Enable
          </Button>
        </div>
      </Card>
    </section>
  ) : (
    <section>
      <div className="-mx-4 flex flex-col gap-3 rounded-lg bg-yellow-300 bg-opacity-20 px-6 py-5 text-lg font-semibold sm:mx-0">
        <p className="font-bold text-yellow-300">
          You have enabled performing actions for this user
        </p>
        <p className="mb-1.5 text-sm font-semibold leading-tight">
          You are not connected to this user's wallet. You can still perform
          Escape Hatch operations for this user (and pay their gas costs) but
          all withdrawals will go to this user's address, not yours.
        </p>
      </div>
    </section>
  )
}
