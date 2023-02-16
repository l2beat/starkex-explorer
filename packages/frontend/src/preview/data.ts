import { Timestamp } from '@explorer/types'

import { UserPageProps } from '../view'

export const USER_PROPS: UserPageProps = {
  account: undefined,
  withdrawableAssets: [
    { icon: 'Icon', symbol: 'BTC', amount: 5 as unknown as bigint },
  ],
  offersToAccept: [
    {
      timestamp: Timestamp.now(),
      asset: 'BTC',
      assetIcon: '',
      amount: 3 as unknown as bigint,
      price: 17 as unknown as bigint,
      status: 'CREATED',
      type: 'BUY',
    },
  ],
  assets: [
    {
      icon: 'Icon',
      name: 'Bitcoin',
      symbol: 'BTC',
      balance: 1 as unknown as bigint,
      value: 2 as unknown as bigint,
      vaultId: 17,
      action: 'CLOSE',
    },
  ],
  totalAssets: 1 as unknown as bigint,
  balanceChanges: [
    {
      timestamp: Timestamp.now(),
      stateUpdateId: 27,
      asset: 'BTC',
      assetIcon: 'I',
      newBalance: 1 as unknown as bigint,
      change: 2 as unknown as bigint,
      vaultId: 17,
    },
  ],
  totalBalanceChanges: 1 as unknown as bigint,
  ethereumTransactions: [
    {
      timestamp: Timestamp.now(),
      hash: '0x63427846783fjhsgdgfuyt2',
      asset: 'BTC',
      amount: 1 as unknown as bigint,
      assetIcon: '',
      status: 'MINED (2/3)',
      type: 'Forced sell',
    },
  ],
  totalEthereumTransactions: 1 as unknown as bigint,
  offers: [
    {
      timestamp: Timestamp.now(),
      asset: 'BTC',
      assetIcon: '',
      amount: 3 as unknown as bigint,
      price: 17 as unknown as bigint,
      status: 'CREATED',
      type: 'BUY',
    },
  ],
  totalOffers: 1 as unknown as bigint,
}
