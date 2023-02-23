import React from 'react'

import { ContentWrapper } from '../../components/page/ContentWrapper'
import { Page } from '../../components/page/Page'
import { WithdrawalPageProps } from './common'

interface SpotWithdrawalPageProps extends WithdrawalPageProps {
  vaultId: string
}

export function WithdrawalPage(props: SpotWithdrawalPageProps) {
  return (
    <Page user={props.user} path="TODO: path" description="TODO: description">
      <ContentWrapper className="flex flex-col gap-12"></ContentWrapper>
    </Page>
  )
}
