import React from 'react'

import { reactToHtml } from '../reactToHtml'
import { TransactionForm } from './TransactionForm'
import { TransactionFormProps } from './TransactionFormProps'

export * from './TransactionFormProps'

export function renderTransactionForm(props: TransactionFormProps) {
  return reactToHtml(<TransactionForm {...props} />)
}
