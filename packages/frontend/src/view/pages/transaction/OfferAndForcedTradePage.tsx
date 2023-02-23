import { UserDetails } from '@explorer/shared'
import { EthereumAddress, Hash256, StarkKey, Timestamp } from '@explorer/types'
import React from 'react'

import { ContentWrapper } from '../../components/page/ContentWrapper'
import { Page } from '../../components/page/Page'
import { reactToHtml } from '../../reactToHtml'

export interface OfferAndForcedTradePageProps {
  user: UserDetails | undefined
  transactionHash: Hash256
  starkKey: StarkKey
  ethereumAddress: EthereumAddress
  // TODO: more
  history: {
    timestamp: Timestamp
    status: 'SENT (1/2)' | 'MINED (2/2)' | 'REVERTED'
  }[]
}

export function renderOfferAndForcedTradePage(
  props: OfferAndForcedTradePageProps
) {
  return reactToHtml(<OfferAndForcedTradePage {...props} />)
}

function OfferAndForcedTradePage(props: OfferAndForcedTradePageProps) {
  return (
    <Page
      user={props.user}
      path={`/transactions/${props.transactionHash.toString()}`}
      description="TODO: description"
    >
      <ContentWrapper className="flex flex-col gap-12">
        {/* TODO: content */}
      </ContentWrapper>
    </Page>
  )
}
