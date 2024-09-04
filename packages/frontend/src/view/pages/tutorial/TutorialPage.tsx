import { PageContext } from '@explorer/shared'
import React from 'react'

import { Page } from '../../components/page/Page'
import { reactToHtml } from '../../reactToHtml'

interface TutorialPageProps {
  context: PageContext
  slug: string
  articleContent: string
}

export function renderTutorialPage(props: TutorialPageProps) {
  return reactToHtml(<TutorialPage {...props} />)
}

export function TutorialPage(props: TutorialPageProps) {
  return (
    <Page
      context={props.context}
      description={`Tutorial explaining ${props.slug}`}
      path={`/tutorials/${props.slug}`}
    >
      <article
        className="prose prose-invert mx-auto mt-16 lg:prose-xl prose-a:text-blue-500 hover:prose-a:text-blue-600 prose-a:prose-headings:text-white prose-a:prose-headings:no-underline hover:prose-a:prose-headings:text-white prose-blockquote:border-slate-800 prose-pre:bg-slate-800 prose-hr:border-slate-800"
        dangerouslySetInnerHTML={{ __html: props.articleContent }}
      ></article>
    </Page>
  )
}
