import { StarkKey } from '@explorer/types'

export const getBalanceChangeTableProps = (starkKey: StarkKey) => ({
  title: 'Balance changes',
  entryShortNamePlural: 'changes',
  entryLongNamePlural: 'balance changes',
  link: `/user/${starkKey.toString()}/balance-changes`,
})

export const getEthereumTransactionTableProps = (starkKey: StarkKey) => ({
  title: 'Ethereum transactions',
  entryShortNamePlural: 'transactions',
  entryLongNamePlural: 'ethereum transactions',
  link: `/user/${starkKey.toString()}/transactions`,
})

export const getOfferTableProps = (starkKey: StarkKey) => ({
  title: 'Offers',
  entryShortNamePlural: 'offers',
  entryLongNamePlural: 'trade offers',
  link: `/user/${starkKey.toString()}/offers`,
})