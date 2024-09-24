import { PageContext } from '@explorer/shared'
import React from 'react'

import { Page } from '../components/page/Page'
import { reactToHtml } from '../reactToHtml'

interface TermsOfServicePageProps {
  context: PageContext
  contents: string
}

export function renderTermsOfServicePage(props: TermsOfServicePageProps) {
  return reactToHtml(<TermsOfServicePage {...props} />)
}

export function TermsOfServicePage(props: TermsOfServicePageProps) {
  return (
    <Page context={props.context} path="/tos" description="Terms of Service">
      <article
        className="prose prose-invert mx-auto my-16 lg:prose-xl prose-a:text-blue-500 hover:prose-a:text-blue-600 prose-a:prose-headings:text-white prose-a:prose-headings:no-underline hover:prose-a:prose-headings:text-white prose-blockquote:border-slate-800 prose-pre:bg-slate-800 prose-hr:border-slate-800"
        dangerouslySetInnerHTML={{ __html: props.contents }}
      ></article>
    </Page>
  )
}
