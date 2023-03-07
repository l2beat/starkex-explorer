export const getBalanceChangeTableProps = (id: string) => ({
  title: 'Balance changes',
  entryShortNamePlural: 'changes',
  entryLongNamePlural: 'balance changes',
  link: `/state-updates/${id}/balance-changes`,
  description: `Shows table of balance changes for #${id} state update`,
})

export const getTransactionTableProps = (id: string) => ({
  title: 'Included forced transactions',
  entryShortNamePlural: 'transactions',
  entryLongNamePlural: 'forced transactions',
  link: `/state-updates/${id}/transactions`,
  description: `Shows table of transactions included in #${id} state update`,
})
