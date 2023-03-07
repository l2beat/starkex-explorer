import { AssetId } from '@explorer/types'
import React from 'react'

import { Page } from '../../components/page/Page'
import { reactToHtml } from '../../reactToHtml'
import { NewPerpetualForcedTradeContent } from './components/NewPerpetualForcedTradeContent'
import { NewPerpetualForcedWithdrawalContent } from './components/NewPerpetualForcedWithdrawalContent'
import { NewForcedActionFormProps } from './NewForcedActionFormProps'

function NewPerpetualForcedActionPage(props: NewForcedActionFormProps) {
  const isWithdrawal = props.asset.hashOrId === AssetId.USDC

  return (
    <Page
      path="/forced/new/:positionId/:assetId"
      description="Allows user to perform forced actions on perpetual assets"
      user={props.user}
    >
      <main className="mx-auto flex-1 p-16">
        <div className="my-auto flex gap-12">
          {isWithdrawal ? (
            <NewPerpetualForcedWithdrawalContent {...props} />
          ) : (
            <NewPerpetualForcedTradeContent {...props} />
          )}
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
