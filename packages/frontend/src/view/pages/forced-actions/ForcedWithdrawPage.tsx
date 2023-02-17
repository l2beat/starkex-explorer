import React from 'react'

import { Button, LinkButton } from '../../components/common/Button'
import { Card } from '../../components/common/Card'
import { Link } from '../../components/common/Link'
import { OrderedList } from '../../components/common/OrderedList'
import { Page } from '../../components/common/page/Page'
import { ForcedActionCard } from '../../components/forced-actions/ForcedActionCard'
import { AmountInput } from '../../components/forced-actions/form/AmountInput'
import { FormId } from '../../components/forced-actions/form/ids'
import { reactToHtml } from '../../reactToHtml'
import {
  ForcedActionFormProps,
  serializeForcedActionsFormProps,
} from './ForcedActionFormProps'

function ForcedWithdrawPage(props: ForcedActionFormProps) {
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
    'After submitting a forced withdrawal request you must now wait up to seven days (but usually just several hours) for the operators of [system name] to process your request.',
    <>
      Once your request has been processed the status will change to{' '}
      <span className="text-yellow-300">’processed’</span> and you will be able
      to withdraw your funds by submitting a withdrawal transaction.
    </>,
  ]
  const propsJson = serializeForcedActionsFormProps(props)

  return (
    <Page
      path="/forced/new/:positionId/:assetId"
      description="Page that allows user withdrawal of USDC"
      account={props.account}
    >
      <div className="my-auto flex gap-12">
        <div className="flex flex-col">
          <span className="text-2xl font-semibold">
            Begin withdrawal process
          </span>
          <span className="mt-6 text-sm font-semibold text-zinc-500">
            The withdrawal process consists of three steps:
          </span>
          <OrderedList items={instructions} className="mt-3 max-w-[438px]" />
        </div>
        <Card className="h-min w-[480px]">
          <form
            id={FormId.Form}
            className="flex flex-col gap-6"
            data-props={propsJson}
          >
            <div className="flex items-end justify-between">
              <span className="text-2xl font-semibold">Withdrawal</span>
              <span>
                <span className="text-sm text-zinc-500">Position</span>{' '}
                <span className="font-semibold">
                  #{props.positionId.toString()}
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
                href={`/user/${props.starkKey}`}
              >
                Back to assets
              </LinkButton>
            </div>
          </form>
        </Card>
      </div>
    </Page>
  )
}

export function renderForcedWithdrawPage(props: ForcedActionFormProps) {
  return reactToHtml(<ForcedWithdrawPage {...props} />)
}
