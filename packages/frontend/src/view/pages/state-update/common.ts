export const getBalanceChangeTableProps = (id: string) => ({
  title: 'Balance changes',
  entryShortNamePlural: 'changes',
  entryLongNamePlural: 'balance changes',
  link: `/state-updates/${id}/balance-changes`,
})

export const getTransactionTableProps = (id: string) => ({
  title: 'Included forced transactions',
  entryShortNamePlural: 'transactions',
  entryLongNamePlural: 'forced transactions',
  link: `/state-updates/${id}/transactions`,
})
