import React from 'react'

import { reactToHtml } from '../reactToHtml'
import { ForcedTransactionsIndex } from './ForcedTransactionsIndex'
import { ForcedTransactionsIndexProps } from './ForcedTransactionsIndexProps'

export function renderForcedTransactionsIndexPage(
  props: ForcedTransactionsIndexProps
) {
  return reactToHtml(<ForcedTransactionsIndex {...props} />)
}

export type { ForcedTransactionsIndexProps }
