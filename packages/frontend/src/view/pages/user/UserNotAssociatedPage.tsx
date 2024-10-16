import { PageContextWithUser } from '@explorer/shared'
import React from 'react'

import { ContentWrapper } from '../../components/page/ContentWrapper'
import { Page } from '../../components/page/Page'
import { reactToHtml } from '../../reactToHtml'

interface UserNotAssociatedPageProps {
  context: PageContextWithUser
}

function UserNotAssociatedPage(props: UserNotAssociatedPageProps) {
  return (
    <Page
      context={props.context}
      description="Register your Stark key to your ethereum address"
      path="/users/register"
    >
      <ContentWrapper>
        <div className="text-xxl font-semibold">
          The wallet is not associated with any active position
        </div>
        <div className="mt-6 font-medium leading-5">
          It looks like this wallet isn’t associated to any active positions at
          the moment. Ensure you're connected to the correct wallet. If you're a
          new user, please allow some time for the blockchain to update -
          Ethereum transactions may take a few moments to settle.
        </div>
      </ContentWrapper>
    </Page>
  )
}

export function renderUserNotAssociatedPage(props: UserNotAssociatedPageProps) {
  return reactToHtml(<UserNotAssociatedPage {...props} />)
}
