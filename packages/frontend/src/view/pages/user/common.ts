import { StarkKey } from '@explorer/types'

export const getAssetsTableProps = (starkKey: StarkKey) => ({
  title: 'Assets',
  entryShortNamePlural: 'assets',
  entryLongNamePlural: 'assets',
  link: `/users/${starkKey.toString()}/assets`,
})

export const getBalanceChangeTableProps = (starkKey: StarkKey) => ({
  title: 'Balance changes',
  entryShortNamePlural: 'changes',
  entryLongNamePlural: 'balance changes',
  link: `/users/${starkKey.toString()}/balance-changes`,
})

export const getTransactionTableProps = (starkKey: StarkKey) => ({
  title: 'Ethereum transactions',
  entryShortNamePlural: 'transactions',
  entryLongNamePlural: 'ethereum transactions',
  link: `/users/${starkKey.toString()}/transactions`,
})

export const getOfferTableProps = (starkKey: StarkKey) => ({
  title: 'Offers',
  entryShortNamePlural: 'offers',
  entryLongNamePlural: 'trade offers',
  link: `/users/${starkKey.toString()}/offers`,
})
