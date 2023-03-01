import { AssetId, EthereumAddress, StarkKey } from '@explorer/types'

import { NewForcedActionFormProps } from '../view/pages/forced-actions/NewForcedActionFormProps'

export const FORCED_WITHDRAW_FORM_PROPS: NewForcedActionFormProps = {
  user: {
    starkKey: StarkKey.fake(),
    address: EthereumAddress.fake(),
  },
  starkExAddress: EthereumAddress('0xD54f502e184B6B739d7D27a6410a67dc462D69c8'),
  positionOrVaultId: 1234n,
  starkKey: StarkKey.fake(),
  asset: {
    hashOrId: AssetId('USDC-6'),
    balance: 69420_654321n,
    priceUSDCents: 100n,
  },
}

export const FORCED_SELL_FORM_PROPS: NewForcedActionFormProps = {
  user: {
    starkKey: StarkKey.fake(),
    address: EthereumAddress.fake(),
  },
  starkExAddress: EthereumAddress('0xD54f502e184B6B739d7D27a6410a67dc462D69c8'),

  positionOrVaultId: 1234n,
  starkKey: StarkKey.fake(),
  asset: {
    hashOrId: AssetId('ETH-9'),
    balance: 21_370000000n,
    priceUSDCents: 2839_39n,
  },
}

export const FORCED_BUY_FORM_PROPS: NewForcedActionFormProps = {
  user: {
    starkKey: StarkKey.fake(),
    address: EthereumAddress.fake(),
  },
  starkExAddress: EthereumAddress('0xD54f502e184B6B739d7D27a6410a67dc462D69c8'),

  positionOrVaultId: 1234n,
  starkKey: StarkKey.fake(),
  asset: {
    hashOrId: AssetId('BTC-10'),
    balance: -5287654321n,
    priceUSDCents: 38504_34n,
  },
}
