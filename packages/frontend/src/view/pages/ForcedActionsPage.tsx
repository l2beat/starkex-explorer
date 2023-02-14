import { AccountDetails } from '@explorer/shared'
import React from 'react'
import { Button } from '../components/common/Button'
import { Card } from '../components/common/Card'
import { FancyList } from '../components/common/FancyList'
import { Link } from '../components/common/Link'
import { Page } from '../components/common/page/Page'
import { ForcedActionActionCard } from '../components/forcedaction/ForcedActionCard'
import { reactToHtml } from '../reactToHtml'

interface ForcedActionsPageProps {
  account: AccountDetails | undefined
}

function ForcedActionsPage({ account }: ForcedActionsPageProps) {
  const instructions = [
    <span>
      Using this form you request a withdrawal of your funds. (Perpetual only)
      You can only withdraw USDC, so to fully exit all funds you should first
      get rid of your synthetic assets by using the close functionality.
      (Perpetual only) This is achieved through a mechanism called forced
      withdrawals, <Link href="https://google.com">link to docs</Link>.
    </span>,
    'After submitting a forced withdrawal request you must now wait up to seven days (but usually just several hours) for the operators of [system name] to process your request.',
    <span>
      Once your request has been processed the status will change to{' '}
      <span className="text-yellow-300">’processed’</span> and you will be able
      to withdraw your funds by submitting a withdrawal transaction.
    </span>,
  ]

  return (
    <Page path="/forced" description="Description" account={account}>
      <div className="my-auto flex gap-12">
        <div className="flex flex-col">
          <span className="text-2xl font-semibold">
            Begin withdrawal process
          </span>
          <span className="mt-6 text-sm font-semibold text-zinc-500">
            The withdrawal process consists of three steps:
          </span>
          <FancyList items={instructions} className="mt-3 max-w-[438px]" />
        </div>
        <Card className="flex h-min w-[480px] flex-col gap-6">
          <div className="flex items-end justify-between">
            <span className="text-2xl font-semibold">Withdrawal</span>
            <span>
              <span className="text-sm text-zinc-500">Position</span>{' '}
              <span className="font-semibold">11273</span>
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <ForcedActionActionCard />
          </div>
          <div className="flex flex-col gap-2">
            <Button className="w-full">Prepare for withdrawal</Button>
            <Button className="w-full" variant="outline">
              Back to assets
            </Button>
          </div>
        </Card>
      </div>
    </Page>
  )
}

export function renderForcedActionsPage(props: ForcedActionsPageProps) {
  return reactToHtml(<ForcedActionsPage {...props} />)
}
