import { PageContext } from '@explorer/shared'
import React from 'react'

import { Page } from '../components/page/Page'
import { reactToHtml } from '../reactToHtml'

interface NotFoundPageProps {
  context: PageContext
  message: string
}

export function renderNotFoundPage(props: NotFoundPageProps) {
  return reactToHtml(<NotFoundPage {...props} />)
}

function NotFoundPage(props: NotFoundPageProps) {
  return (
    <Page
      path="/"
      description="Not found page"
      context={props.context}
      withoutSearch
    >
      <div className="flex flex-1 flex-col items-center justify-center">
        <span className="text-[128px] font-extrabold leading-none text-brand">
          404
        </span>
        <span className="text-[64px] font-bold leading-none">Not Found</span>
        <span className="mt-12 text-xl">{props.message}</span>
      </div>
    </Page>
  )
}
