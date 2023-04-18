import { PageContextWithUser } from '@explorer/shared'
import { AssetId } from '@explorer/types'
import React from 'react'

import { Card } from '../../components/Card'
import { OrderedList } from '../../components/OrderedList'
import { Page } from '../../components/page/Page'
import { reactToHtml } from '../../reactToHtml'
import { getForcedActionInstructionsParams } from './components/common'
import { FormId } from './components/form/ids'
import { NewPerpetualForcedTradeFormContent } from './components/NewPerpetualForcedTradeFormContent'
import { NewPerpetualForcedWithdrawalFormContent } from './components/NewPerpetualForcedWithdrawalFormContent'
import {
  NewForcedActionFormProps,
  serializeForcedActionsFormProps,
} from './NewForcedActionFormProps'

type NewPerpetualForcedActionPageProps = NewForcedActionFormProps & {
  context: PageContextWithUser<'perpetual'>
}

function NewPerpetualForcedActionPage(
  props: NewPerpetualForcedActionPageProps
) {
  const { context, ...formProps } = props
  const isWithdrawal = props.asset.hashOrId === AssetId.USDC
  const propsJson = serializeForcedActionsFormProps(props)
  const userJson = JSON.stringify(context.user)
  const instructionParams = getForcedActionInstructionsParams(
    isWithdrawal,
    context.instanceName
  )
  return (
    <Page
      path="/forced/new/:positionId/:assetId"
      description="Perform forced actions on your assets"
      context={context}
    >
      <main className="mx-auto flex-1 p-16">
        <div className="my-auto flex gap-12">
          <div className="mt-6 flex max-w-md flex-col">
            <span className="text-xl font-semibold">
              {instructionParams.header}
            </span>
            <span className="mt-3 text-sm font-semibold text-zinc-500">
              The process you are about to begin should be used only in
              emergency. Please use a regular operation on the exchange to
              perform it.
            </span>
            <span className="mt-6 text-sm font-semibold text-zinc-500">
              {instructionParams.description}
            </span>
            <OrderedList items={instructionParams.items} className="mt-3" />
          </div>
          <Card className="h-min w-[480px]">
            <form
              id={FormId.Form}
              className="flex flex-col gap-6"
              data-props={propsJson}
              data-user={userJson}
            >
              {isWithdrawal ? (
                <NewPerpetualForcedWithdrawalFormContent {...formProps} />
              ) : (
                <NewPerpetualForcedTradeFormContent {...formProps} />
              )}
            </form>
          </Card>
        </div>
      </main>
    </Page>
  )
}

export function renderNewPerpetualForcedActionPage(
  props: NewPerpetualForcedActionPageProps
) {
  return reactToHtml(<NewPerpetualForcedActionPage {...props} />)
}
