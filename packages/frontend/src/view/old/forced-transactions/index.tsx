import React from 'react'

import { reactToHtml } from '../../reactToHtml'
import { ForcedTransactionDetails } from './ForcedTransactionDetails'
import { ForcedTransactionDetailsProps } from './ForcedTransactionDetailsProps'
import { ForcedTransactionsIndex } from './ForcedTransactionsIndex'
import { ForcedTransactionsIndexProps } from './ForcedTransactionsIndexProps'

export * from './ForcedTransactionDetailsProps'
export * from './ForcedTransactionsIndexProps'

export function renderOldForcedTransactionsIndexPage(
  props: ForcedTransactionsIndexProps
) {
  return reactToHtml(<ForcedTransactionsIndex {...props} />)
}

export function renderOldForcedTransactionDetailsPage(
  props: ForcedTransactionDetailsProps
) {
  return reactToHtml(<ForcedTransactionDetails {...props} />)
}
