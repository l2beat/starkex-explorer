import React from 'react'

import { getInstanceName } from '../../../../utils/instance'
import { Button, LinkButton } from '../../../components/Button'
import { Card } from '../../../components/Card'
import { Link } from '../../../components/Link'
import { OrderedList } from '../../../components/OrderedList'
import { reactToHtml } from '../../../reactToHtml'
import { ForcedActionCard } from './ForcedActionCard'
import { AmountInput } from './form/AmountInput'
import { FormId } from './form/ids'
import {
  NewForcedActionFormProps,
  serializeForcedActionsFormProps,
} from '../NewForcedActionFormProps'

export function NewPerpetualForcedWithdrawalContent(props: NewForcedActionFormProps) {
  const instructions = [
    <>
      Using this form you request a withdrawal of your funds. (Perpetual only)
      You can only withdraw USDC, so to fully exit all funds you should first
      get rid of your synthetic assets by using the close functionality.
      (Perpetual only) This is achieved through a mechanism called forced
      withdrawals,{' '}
      <Link href="https://docs.starkware.co/starkex/perpetual/perpetual-trading-forced-withdrawal-and-forced-trade.html#forced_withdrawal">
        link to docs
      </Link>
      .
    </>,
    `After submitting a forced withdrawal request you must now wait up to seven days (but usually just several hours) for the operators of ${getInstanceName()} to process your request.`,
    <>
      Once your request has been processed the status will change to{' '}
      <span className="text-yellow-300">’processed’</span> and you will be able
      to withdraw your funds by submitting a withdrawal transaction.
    </>,
  ]
  const propsJson = serializeForcedActionsFormProps(props)

  return (
    <>
      <div className="mt-6 flex flex-col">
        <span className="text-xl font-semibold">Begin withdrawal process</span>
        <span className="mt-6 text-sm font-semibold text-zinc-500">
          The withdrawal process consists of three steps:
        </span>
        <OrderedList items={instructions} className="mt-3 max-w-md" />
      </div>
      <Card className="h-min w-[480px]">
        <form
          id={FormId.Form}
          className="flex flex-col gap-6"
          data-props={propsJson}
        >
          <div className="flex items-end justify-between">
            <span className="text-xl font-semibold">Withdrawal</span>
            <span>
              <span className="text-sm font-medium text-zinc-500">
                Position
              </span>{' '}
              <span className="text-lg font-semibold">
                #{props.positionOrVaultId.toString()}
              </span>
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <ForcedActionCard>
              <AmountInput {...props} />
            </ForcedActionCard>
          </div>
          <div className="flex flex-col gap-2">
            <Button className="w-full" id={FormId.SubmitButton}>
              Prepare for withdrawal
            </Button>
            <LinkButton
              className="w-full"
              variant="outlined"
              href={`/users/${props.starkKey.toString()}`}
            >
              Back to assets
            </LinkButton>
          </div>
        </form>
      </Card>
    </>
  )
}