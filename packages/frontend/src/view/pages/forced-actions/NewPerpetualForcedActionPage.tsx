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

function NewPerpetualForcedActionPage(props: NewForcedActionFormProps) {
  const isWithdrawal = props.asset.hashOrId === AssetId.USDC
  const propsJson = serializeForcedActionsFormProps(props)
  const instructionParams = getForcedActionInstructionsParams(isWithdrawal)
  return (
    <Page
      path="/forced/new/:positionId/:assetId"
      description="Allows user to perform forced actions on perpetual assets"
      user={props.user}
    >
      <main className="mx-auto flex-1 p-16">
        <div className="my-auto flex gap-12">
          <div className="mt-6 flex flex-col">
            <span className="text-xl font-semibold">
              {instructionParams.header}
            </span>
            <span className="mt-6 text-sm font-semibold text-zinc-500">
              {instructionParams.description}
            </span>
            <OrderedList
              items={instructionParams.items}
              className="mt-3 max-w-md"
            />
          </div>
          <Card className="h-min w-[480px]">
            <form
              id={FormId.Form}
              className="flex flex-col gap-6"
              data-props={propsJson}
            >
              {isWithdrawal ? (
                <NewPerpetualForcedWithdrawalFormContent {...props} />
              ) : (
                <NewPerpetualForcedTradeFormContent {...props} />
              )}
            </form>
          </Card>
        </div>
      </main>
    </Page>
  )
}

export function renderNewPerpetualForcedActionPage(
  props: NewForcedActionFormProps
) {
  return reactToHtml(<NewPerpetualForcedActionPage {...props} />)
}
