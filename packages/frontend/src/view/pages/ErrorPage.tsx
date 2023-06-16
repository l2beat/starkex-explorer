import { PageContext } from '@explorer/shared'
import React from 'react'

import { Page } from '../components/page/Page'
import { reactToHtml } from '../reactToHtml'

type ErrorPageProps = {
  context: PageContext
} & (
  | {
      statusCode: 404
      message: string
    }
  | {
      statusCode: 400
      message?: string
    }
  | {
      statusCode: 500
    }
)

export function renderErrorPage(props: ErrorPageProps) {
  return reactToHtml(<ErrorPage {...props} />)
}

const ERROR_TITLES: Record<ErrorPageProps['statusCode'], string> = {
  '400': 'Bad request',
  '404': 'Not found',
  '500': 'Internal server error',
}

const getErrorMessages = (pageProps: ErrorPageProps) => {
  switch (pageProps.statusCode) {
    case 400:
      return (
        pageProps.message || 'Oops! Something went wrong. Please try again.'
      )
    case 404:
      return pageProps.message
    case 500:
      return 'Oops! Something went wrong. Please try again.'
  }
}

function ErrorPage(props: ErrorPageProps) {
  const errorMessage = getErrorMessages(props)

  return (
    <Page
      path="/"
      description="Not found page"
      context={props.context}
      withoutSearch
    >
      <div className="flex flex-1 flex-col items-center justify-center">
        <span className="text-[128px] font-extrabold leading-none text-brand">
          {props.statusCode}
        </span>
        <span className="text-[64px] font-bold leading-none">
          {ERROR_TITLES[props.statusCode]}
        </span>
        <span className="mt-12 text-xl">{errorMessage}</span>
      </div>
    </Page>
  )
}
