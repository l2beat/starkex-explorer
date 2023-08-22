import { PageContext } from '@explorer/shared'
import React from 'react'

import { Card } from '../../components/Card'
import { ContentWrapper } from '../../components/page/ContentWrapper'
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
      <ContentWrapper>
        <Card>
          <article
            className="prose prose-invert mx-auto lg:prose-xl"
            dangerouslySetInnerHTML={{ __html: props.articleContent }}
          ></article>
        </Card>
      </ContentWrapper>
    </Page>
  )
}
