import { PageContextWithUser, serializeCollateralAsset } from '@explorer/shared'
import React from 'react'

import { Card } from '../../components/Card'
import { OrderedList } from '../../components/OrderedList'
import { ContentWrapper } from '../../components/page/ContentWrapper'
import { Page } from '../../components/page/Page'
import { reactToHtml } from '../../reactToHtml'
import { DydxStoppedInfoPanel } from '../user/components/DyDxStoppedInfoPanel'
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
  const { context } = props
  const isWithdrawal =
    props.asset.hashOrId === props.context.collateralAsset.assetId
  const instructionParams = getForcedActionInstructionsParams(isWithdrawal)

  const propsJson = serializeForcedActionsFormProps(props)
  const userJson = JSON.stringify(context.user)
  const collateralAssetJson = serializeCollateralAsset(
    props.context.collateralAsset
  )

  return (
    <Page
      path="/forced/new/:positionId/:assetId"
      description="Perform forced actions on your assets"
      context={context}
    >
      <ContentWrapper className="flex flex-col lg:gap-12">
        <DydxStoppedInfoPanel context={context} />
        <div className="grid auto-rows-min grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-12">
          <div className="flex flex-col lg:mt-6">
            <span className="hidden text-xl font-semibold lg:inline">
              {instructionParams.header}
            </span>
            <span className="text-sm font-semibold text-zinc-500 lg:mt-3">
              <strong>
                The cost of this process is very high, and so should only be
                used in an emergency.
              </strong>{' '}
              For regular usage, you should perform the equivalent standard
              operation through the exchange.
            </span>
            <span className="mt-6 text-sm font-semibold text-zinc-500">
              {instructionParams.description}
            </span>
            <OrderedList items={instructionParams.items} className="mt-3" />
          </div>
          <Card className="row-start-1 h-min lg:col-start-2">
            <form
              id={FormId.Form}
              className="flex flex-col gap-6"
              data-props={propsJson}
              data-user={userJson}
              data-collateral-asset={collateralAssetJson}
            >
              {isWithdrawal ? (
                <NewPerpetualForcedWithdrawalFormContent
                  positionOrVaultId={props.positionOrVaultId}
                  asset={props.asset}
                  starkKey={props.starkKey}
                  instanceName={props.context.instanceName}
                />
              ) : (
                <NewPerpetualForcedTradeFormContent
                  positionOrVaultId={props.positionOrVaultId}
                  asset={props.asset}
                  starkKey={props.starkKey}
                  collateralAsset={props.context.collateralAsset}
                  instanceName={props.context.instanceName}
                />
              )}
            </form>
          </Card>
        </div>
      </ContentWrapper>
    </Page>
  )
}

export function renderNewPerpetualForcedActionPage(
  props: NewPerpetualForcedActionPageProps
) {
  return reactToHtml(<NewPerpetualForcedActionPage {...props} />)
}
