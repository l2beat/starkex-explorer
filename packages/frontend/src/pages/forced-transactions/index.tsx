import React from 'react'

import { reactToHtml } from '../reactToHtml'
import { ForcedTransactionsIndex } from './ForcedTransactionsIndex'
import { ForcedTransactionDetails } from './ForcedTransactionDetails'
import { ForcedTransactionsIndexProps } from './ForcedTransactionsIndexProps'
import { ForcedTransactionDetailsProps } from './ForcedTransactionDetailsProps'

export function renderForcedTransactionsIndexPage(
  props: ForcedTransactionsIndexProps
) {
  return reactToHtml(<ForcedTransactionsIndex {...props} />)
}

export function renderForcedTransactionDetailsPage(
  props: ForcedTransactionDetailsProps
) {
  return reactToHtml(<ForcedTransactionDetails {...props} />)
}

export type { ForcedTransactionsIndexProps, ForcedTransactionDetailsProps }
