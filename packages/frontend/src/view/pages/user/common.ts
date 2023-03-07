import { StarkKey } from '@explorer/types'

export const getAssetsTableProps = (starkKey: StarkKey) => ({
  title: 'Assets',
  entryShortNamePlural: 'assets',
  entryLongNamePlural: 'assets',
  link: `/users/${starkKey.toString()}/assets`,
  description: `Shows table of assets for ${starkKey.toString()} user`,
})

export const getBalanceChangeTableProps = (starkKey: StarkKey) => ({
  title: 'Balance changes',
  entryShortNamePlural: 'changes',
  entryLongNamePlural: 'balance changes',
  link: `/users/${starkKey.toString()}/balance-changes`,
  description: `Shows table of balance changes for ${starkKey.toString()} user`,
})

export const getTransactionTableProps = (starkKey: StarkKey) => ({
  title: 'Ethereum transactions',
  entryShortNamePlural: 'transactions',
  entryLongNamePlural: 'ethereum transactions',
  link: `/users/${starkKey.toString()}/transactions`,
  description: `Shows table of ethereum transactions for ${starkKey.toString()} user`,
})

export const getOfferTableProps = (starkKey: StarkKey) => ({
  title: 'Offers',
  entryShortNamePlural: 'offers',
  entryLongNamePlural: 'trade offers',
  link: `/users/${starkKey.toString()}/offers`,
  description: `Shows table ${starkKey.toString()} user's trade offers`,
})
