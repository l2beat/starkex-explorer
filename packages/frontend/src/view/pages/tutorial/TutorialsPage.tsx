import { PageContext } from '@explorer/shared'
import React from 'react'

import { Button } from '../../components/Button'
import { ContentWrapper } from '../../components/page/ContentWrapper'
import { Page } from '../../components/page/Page'
import { PageTitle } from '../../components/PageTitle'
import { reactToHtml } from '../../reactToHtml'
import { HomeTutorialEntry } from '../home/components/HomeTutorials'

interface TutorialsPageProps {
  context: PageContext
  tutorials: HomeTutorialEntry[]
}

export function renderTutorialsPage(props: TutorialsPageProps) {
  return reactToHtml(<TutorialsPage {...props} />)
}

export function TutorialsPage(props: TutorialsPageProps) {
  return (
    <Page
      context={props.context}
      description="List of all tutorials"
      path={'/tutorials'}
    >
      <ContentWrapper>
        <PageTitle className="!mb-14 !text-[48px]">Tutorials</PageTitle>
        <div className="flex flex-col gap-9">
          {props.tutorials.map((tutorial, i) => (
            <div key={i} className="group flex w-full gap-11">
              <img
                className="w-[100px] rounded-lg"
                src="/images/starkex-logo.png"
              />
              <div className="flex flex-col justify-between">
                <p className="text-xl font-semibold leading-tight">
                  {tutorial.title}
                </p>
                <Button
                  as="a"
                  href={`/tutorials/${tutorial.slug}`}
                  variant="outlined"
                  className="w-36"
                >
                  Read now
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ContentWrapper>
    </Page>
  )
}
