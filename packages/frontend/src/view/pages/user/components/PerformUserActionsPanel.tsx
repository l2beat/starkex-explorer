import { PageContext } from '@explorer/shared'
import { StarkKey } from '@explorer/types'
import React from 'react'

import { InfoIcon } from '../../../assets/icons/InfoIcon'
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
        <p className="mb-2 font-bold leading-tight">
          Do you want to enable actions for this user?
        </p>
        <div className="flex gap-4 max-lg:flex-col">
          <p className="flex-1 text-sm font-semibold leading-tight">
            You are not connected to this user's wallet. You can enable Escape
            Hatch operations and pay their gas cost, but all withdrawals will go
            to this user's address, not yours.
          </p>
          <Button
            as="a"
            href="?performUserActions=true"
            variant="outlined"
            className="mx-auto w-full sm:w-1/2 lg:w-48"
          >
            Enable
          </Button>
        </div>
      </Card>
    </section>
  ) : (
    <section>
      <Card className="flex flex-col gap-3 bg-yellow-300 bg-opacity-20">
        <div className="flex">
          <InfoIcon className="mr-1.5 mt-px shrink-0 fill-yellow-300" />
          <p className="font-bold leading-tight text-yellow-300">
            You have enabled performing actions for this user
          </p>
        </div>
        <p className="mb-1.5 text-sm font-semibold leading-tight">
          You are not connected to this user's wallet. You can still perform
          Escape Hatch operations for this user (and pay their gas costs) but
          all withdrawals will go to this user's address, not yours.
        </p>
      </Card>
    </section>
  )
}
