import { PageContextWithUser } from '@explorer/shared'
import React from 'react'

import { assetToInfo } from '../../../utils/assets'
import { formatAmount } from '../../../utils/formatting/formatAmount'
import { AssetWithLogo } from '../../components/AssetWithLogo'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { Link } from '../../components/Link'
import { OrderedList } from '../../components/OrderedList'
import { ContentWrapper } from '../../components/page/ContentWrapper'
import { Page } from '../../components/page/Page'
import { TermsOfServiceAck } from '../../components/TermsOfServiceAck'
import { reactToHtml } from '../../reactToHtml'
import { ForcedActionCard } from './components/ForcedActionCard'
import {
  NewForcedActionFormProps,
  serializeForcedActionsFormProps,
} from './NewForcedActionFormProps'

export const SPOT_FORCED_WITHDRAWAL_FORM_ID = 'spot-withdraw-form'

type Props = NewForcedActionFormProps & {
  context: PageContextWithUser<'spot'>
}

function NewSpotForcedWithdrawalPage(props: Props) {
  const { context, ...formProps } = props
  const instructions = [
    <>
      Using this form you request a withdrawal of your funds. This is achieved
      through a mechanism called{' '}
      <Link href="https://docs.starkware.co/starkex/spot/spot-trading-full-withdrawals.html">
        full withdrawals
      </Link>
      . Note that you can only withdraw your entire funds.
    </>,
    'After submitting the request you must now wait up to seven days (but usually just several hours) for the exchange to process your request.',
    <>
      Once this is done the status will change to ’processed’ and you will be
      able to withdraw your funds by submitting a withdrawal transaction.
    </>,
  ]
  const assetInfo = assetToInfo(props.asset)
  const formPropsJson = serializeForcedActionsFormProps(formProps)
  const userJson = JSON.stringify(context.user)
  const formattedBalance = formatAmount(props.asset, props.asset.balance)
  return (
    <Page
      path="/forced/new/:vaultId"
      description="Perform forced withdrawal"
      context={props.context}
    >
      <ContentWrapper className="grid auto-rows-min grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-12">
        <div className="flex flex-col lg:mt-6">
          <span className="hidden text-xl font-semibold lg:inline">
            Begin withdrawal process
          </span>
          <span className="text-sm font-semibold text-zinc-500 lg:mt-3">
            <strong>
              The cost of this process is very high, and so should only be used
              in an emergency.
            </strong>{' '}
            For regular usage, you should perform the equivalent standard
            operation through the exchange.
          </span>
          <span className="mt-6 text-sm font-semibold text-zinc-500">
            The withdrawal process consists of three steps:
          </span>
          <OrderedList items={instructions} className="mt-3" />
        </div>
        <Card className="row-start-1 h-min lg:col-start-2">
          <form
            id={SPOT_FORCED_WITHDRAWAL_FORM_ID}
            className="flex flex-col gap-6"
            data-props={formPropsJson}
            data-user={userJson}
          >
            <div className="flex items-end justify-between">
              <span className="text-xl font-semibold">Withdrawal</span>
              <span>
                <span className="text-sm font-medium text-zinc-500">Vault</span>{' '}
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
                    <span className="break-all text-xl font-semibold">
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
              <TermsOfServiceAck prefix="By initiating this action you agree to our" />
              <Button className="w-full" size="lg">
                Prepare for withdrawal
              </Button>
              <Button
                as="a"
                className="w-full"
                size="lg"
                variant="outlined"
                href={`/users/${props.starkKey.toString()}`}
              >
                Back to assets
              </Button>
            </div>
          </form>
        </Card>
      </ContentWrapper>
    </Page>
  )
}

export function renderNewSpotForcedWithdrawPage(props: Props) {
  return reactToHtml(<NewSpotForcedWithdrawalPage {...props} />)
}
