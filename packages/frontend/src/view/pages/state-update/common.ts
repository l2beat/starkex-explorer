export const getBalanceChangeTableProps = (id: string) => ({
  title: 'Balance changes',
  entryShortNamePlural: 'changes',
  entryLongNamePlural: 'balance changes',
  link: `/state-updates/${id}/balance-changes`,
})
