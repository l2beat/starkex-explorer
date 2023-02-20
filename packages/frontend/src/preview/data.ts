import { AssetId, EthereumAddress, StarkKey } from '@explorer/types'

import { ForcedActionFormProps } from '../view/pages/forced-actions/ForcedActionFormProps'

export const FORCED_ACTION_FORM_PROPS: ForcedActionFormProps = {
  user: {
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
  user: {
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
  user: {
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
  user: {
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
