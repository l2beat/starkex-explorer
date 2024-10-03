import { PageContext } from '@explorer/shared'
import { StarkKey } from '@explorer/types'
import React from 'react'

import { Button } from '../../../components/Button'

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
  return (
    <section>
      <div className="-mx-4 flex flex-col gap-3 rounded-lg bg-yellow-300 bg-opacity-20 px-6 py-5 text-lg font-semibold sm:mx-0">
        {!props.performUserActions ? (
          <>
            <p className="font-bold text-yellow-300">
              Do you want to perform actions for this user?
            </p>
            <p className="mb-1.5 flex-1 text-sm font-semibold">
              You are not connected to this user's wallet. You can enable Escape
              Hatch operations and pay their gas cost, but all withdrawals will
              go to this user's address, not yours.
            </p>
            <Button
              as="a"
              href="?performUserActions=true"
              className="w-full bg-yellow-300 leading-tight text-black hover:!bg-[#fdf17c]"
              size="lg"
            >
              Perform
            </Button>
          </>
        ) : (
          <>
            <p className="font-bold text-yellow-300">
              You can perform actions for this user
            </p>
            <p className="mb-1.5 text-sm font-semibold">
              You are not connected to this user's wallet. You can still perform
              Escape Hatch operations for this user (and pay their gas costs)
              but all withdrawals will go to this user's address, not yours.
            </p>
          </>
        )}
      </div>
    </section>
  )
}
