export const getBalanceChangeTableProps = (id: string) => ({
  title: 'Balance changes',
  entryShortNamePlural: 'changes',
  entryLongNamePlural: 'balance changes',
  path: `/state-updates/${id}/balance-changes`,
  description: `Balance changes for #${id} state update`,
})

export const getTransactionTableProps = (id: string) => ({
  title: 'Included forced transactions',
  entryShortNamePlural: 'transactions',
  entryLongNamePlural: 'forced transactions',
  path: `/state-updates/${id}/transactions`,
  description: `Transactions included in #${id} state update`,
})
