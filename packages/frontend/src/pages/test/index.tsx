import React from 'react'

import { reactToHtml } from '../reactToHtml'
import { TestPage } from './TestPage'
import { TestPageProps } from './TestPageProps'

export * from './TestPageProps'

export function renderTestPagePage(props: TestPageProps) {
  return reactToHtml(<TestPage {...props} />)
}
