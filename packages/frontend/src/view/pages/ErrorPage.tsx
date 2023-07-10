import { PageContext } from '@explorer/shared'
import React from 'react'

import { ContentWrapper } from '../components/page/ContentWrapper'
import { Page } from '../components/page/Page'
import { reactToHtml } from '../reactToHtml'

type ErrorPageProps = {
  context: PageContext
} & (
  | {
      statusCode: 400 | 404
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
        pageProps.message ?? 'Oops! Something went wrong. Please try again.'
      )
    case 404:
      return (
        pageProps.message ?? "We couldn't find the page you were looking for."
      )
    case 500:
      return 'Oops! Something went wrong. Please try again.'
  }
}

function ErrorPage(props: ErrorPageProps) {
  const errorMessage = getErrorMessages(props)

  return (
    <Page path="/" description="Not found page" context={props.context}>
      <ContentWrapper className="flex flex-1 flex-col items-center justify-center">
        <span className="text-[80px] font-extrabold  leading-tight text-brand md:text-[160px]">
          {props.statusCode}
        </span>
        <span className="text-center text-xl font-bold leading-none md:text-[64px]">
          {ERROR_TITLES[props.statusCode]}
        </span>
        <span className="text-l mt-12 text-center md:text-xl">
          {errorMessage}
        </span>
      </ContentWrapper>
    </Page>
  )
}
