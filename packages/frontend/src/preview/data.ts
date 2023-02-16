import { AssetId, EthereumAddress, StarkKey, Timestamp } from '@explorer/types'

import { UserPageProps } from '../view'
import { ForcedActionFormProps } from '../view/pages/forcedactions/ForcedActionFormProps'

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

export const FORCED_ACTION_FORM_PROPS: ForcedActionFormProps = {
  account: {
    address: EthereumAddress.fake(),
    positionId: 123n,
    hasUpdates: false,
  },
  perpetualAddress: EthereumAddress(
    '0xD54f502e184B6B739d7D27a6410a67dc462D69c8'
  ),
  selectedAsset: AssetId('USDC-6'),
  positionId: 1234n,
  starkKey: StarkKey.fake(),
  assets: [
    {
      assetId: AssetId('USDC-6'),
      balance: 69420_654321n,
      priceUSDCents: 100n,
      totalUSDCents: 69420_65n,
    },
    {
      assetId: AssetId('ETH-9'),
      balance: 21_370000000n,
      priceUSDCents: 2839_39n,
      totalUSDCents: 60678_04n,
    },
    {
      assetId: AssetId('BTC-10'),
      balance: -5287654321n,
      priceUSDCents: 38504_34n,
      totalUSDCents: -20359_76n,
    },
    {
      assetId: AssetId('DOGE-5'),
      balance: 100_00000n,
      priceUSDCents: 13n,
      totalUSDCents: 13_12n,
    },
    {
      assetId: AssetId('SUSHI-7'),
      balance: -2_7654321n,
      priceUSDCents: 2_44n,
      totalUSDCents: 6_75n,
    },
  ],
}

export const FORCED_WITHDRAW_FORM_PROPS: ForcedActionFormProps = {
  account: {
    address: EthereumAddress.fake(),
    positionId: 123n,
    hasUpdates: false,
  },
  perpetualAddress: EthereumAddress(
    '0xD54f502e184B6B739d7D27a6410a67dc462D69c8'
  ),
  selectedAsset: AssetId('USDC-6'),
  positionId: 1234n,
  starkKey: StarkKey.fake(),
  assets: [
    {
      assetId: AssetId('USDC-6'),
      balance: 69420_654321n,
      priceUSDCents: 100n,
      totalUSDCents: 69420_65n,
    },
  ],
}

export const FORCED_SELL_FORM_PROPS: ForcedActionFormProps = {
  account: {
    address: EthereumAddress.fake(),
    positionId: 123n,
    hasUpdates: false,
  },
  perpetualAddress: EthereumAddress(
    '0xD54f502e184B6B739d7D27a6410a67dc462D69c8'
  ),
  selectedAsset: AssetId('ETH-9'),
  positionId: 1234n,
  starkKey: StarkKey.fake(),
  assets: [
    {
      assetId: AssetId('USDC-6'),
      balance: 69420_654321n,
      priceUSDCents: 100n,
      totalUSDCents: 69420_65n,
    },
    {
      assetId: AssetId('ETH-9'),
      balance: 21_370000000n,
      priceUSDCents: 2839_39n,
      totalUSDCents: 60678_04n,
    },
  ],
}

export const FORCED_BUY_FORM_PROPS: ForcedActionFormProps = {
  account: {
    address: EthereumAddress.fake(),
    positionId: 123n,
    hasUpdates: false,
  },
  perpetualAddress: EthereumAddress(
    '0xD54f502e184B6B739d7D27a6410a67dc462D69c8'
  ),
  selectedAsset: AssetId('BTC-10'),
  positionId: 1234n,
  starkKey: StarkKey.fake(),
  assets: [
    {
      assetId: AssetId('USDC-6'),
      balance: 69420_654321n,
      priceUSDCents: 100n,
      totalUSDCents: 69420_65n,
    },
    {
      assetId: AssetId('BTC-10'),
      balance: -5287654321n,
      priceUSDCents: 38504_34n,
      totalUSDCents: -20359_76n,
    },
  ],
}
