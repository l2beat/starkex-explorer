import { PageContextWithUser } from '@explorer/shared'
import React from 'react'

import { assetToInfo } from '../../../utils/assets'
import { formatAmount } from '../../../utils/formatting/formatAmount'
import { AssetWithLogo } from '../../components/AssetWithLogo'
import { Button, LinkButton } from '../../components/Button'
import { Card } from '../../components/Card'
import { Link } from '../../components/Link'
import { OrderedList } from '../../components/OrderedList'
import { Page } from '../../components/page/Page'
import { reactToHtml } from '../../reactToHtml'
import { ForcedActionCard } from './components/ForcedActionCard'
import {
  NewForcedActionFormProps,
  serializeForcedActionsFormProps,
} from './NewForcedActionFormProps'

export const SpotForcedWithdrawalFormId = 'spot-withdraw-form'

interface Props extends NewForcedActionFormProps {
  context: PageContextWithUser
}

function NewSpotForcedWithdrawalPage(props: Props) {
  const instructions = [
    <>
      Using this form you request a withdrawal of your funds. This is achieved
      through a mechanism called full withdrawals,{' '}
      <Link href="https://docs.starkware.co/starkex/spot/spot-trading-full-withdrawals.html">
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
  const assetInfo = assetToInfo(props.asset)
  const propsJson = serializeForcedActionsFormProps(props)
  const formattedBalance = formatAmount(props.asset, props.asset.balance)
  return (
    <Page
      path="/forced/new/:vaultId"
      description="Perform forced withdrawal"
      context={props.context}
    >
      <main className="mx-auto flex-1 p-16">
        <div className="my-auto flex gap-12">
          <div className="mt-6 flex max-w-md flex-col">
            <span className="text-xl font-semibold">
              Begin withdrawal process
            </span>
            <span className="mt-3 text-sm font-semibold text-zinc-500">
              The process you are about to begin should be used only in
              emergency. Please use a regular operation on the exchange to
              perform it.
            </span>
            <span className="mt-6 text-sm font-semibold text-zinc-500">
              The withdrawal process consists of three steps:
            </span>
            <OrderedList items={instructions} className="mt-3" />
          </div>
          <Card className="h-min w-[480px]">
            <form
              id={SpotForcedWithdrawalFormId}
              className="flex flex-col gap-6"
              data-props={propsJson}
            >
              <div className="flex items-end justify-between">
                <span className="text-xl font-semibold">Withdrawal</span>
                <span>
                  <span className="text-sm font-medium text-zinc-500">
                    Vault
                  </span>{' '}
                  <span className="text-lg font-semibold">
                    #{props.positionOrVaultId.toString()}
                  </span>
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <ForcedActionCard>
                  <div className="flex gap-2">
                    <div className="flex flex-1 flex-col gap-2">
                      <span className="text-sm font-medium text-zinc-500">
                        Balance
                      </span>
                      <span className="text-xl font-semibold">
                        {formattedBalance}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-sm font-medium text-zinc-500">
                        Asset
                      </span>
                      <AssetWithLogo assetInfo={assetInfo} />
                    </div>
                  </div>
                </ForcedActionCard>
              </div>
              <div className="flex flex-col gap-2">
                <Button className="w-full">Prepare for withdrawal</Button>
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
        </div>
      </main>
    </Page>
  )
}

export function renderNewSpotForcedWithdrawPage(props: Props) {
  return reactToHtml(<NewSpotForcedWithdrawalPage {...props} />)
}
