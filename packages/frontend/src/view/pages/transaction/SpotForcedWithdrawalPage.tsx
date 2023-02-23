import { UserDetails } from '@explorer/shared'
import { EthereumAddress, Hash256, StarkKey, Timestamp } from '@explorer/types'
import React from 'react'

import { ContentWrapper } from '../../components/page/ContentWrapper'
import { Page } from '../../components/page/Page'
import { reactToHtml } from '../../reactToHtml'

export interface SpotForcedWithdrawalPageProps {
  user: UserDetails | undefined
  transactionHash: Hash256
  starkKey: StarkKey
  ethereumAddress: EthereumAddress
  vaultId: string
  history: {
    timestamp: Timestamp
    status: 'SENT (1/3)' | 'MINED (2/3)' | 'REVERTED' | 'INCLUDED (3/3)'
  }[]
}

export function renderSpotForcedWithdrawalPage(
  props: SpotForcedWithdrawalPageProps
) {
  return reactToHtml(<SpotForcedWithdrawalPage {...props} />)
}

function SpotForcedWithdrawalPage(props: SpotForcedWithdrawalPageProps) {
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
