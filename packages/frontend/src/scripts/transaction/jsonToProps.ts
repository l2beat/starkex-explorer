import { AssetId, EthereumAddress, StarkKey } from '@explorer/types'

import { PositionAssetEntry } from '../../pages'
import { TransactionFormProps } from '../../pages/transaction-form'

export function jsonToProps(propsJson: unknown): TransactionFormProps {
  assert(isObject(propsJson))
  assert(Array.isArray(propsJson.assets))
  return {
    account: castString(propsJson.account, EthereumAddress),
    perpetualAddress: castString(propsJson.perpetualAddress, EthereumAddress),
    positionId: castString(propsJson.positionId, BigInt),
    publicKey: castString(propsJson.publicKey, StarkKey),
    selectedAsset: castString(propsJson.selectedAsset, AssetId),
    assets: propsJson.assets.map(jsonToAsset),
  }
}

function jsonToAsset(assetJson: unknown): PositionAssetEntry {
  assert(isObject(assetJson))
  return {
    assetId: castString(assetJson.assetId, AssetId),
    balance: castString(assetJson.balance, BigInt),
    priceUSDCents: castString(assetJson.priceUSDCents, BigInt),
    totalUSDCents: castString(assetJson.totalUSDCents, BigInt),
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function castString<T>(value: unknown, fn: (value: string) => T): T {
  assert(typeof value === 'string')
  return fn(value)
}

function assert(premise: boolean): asserts premise {
  if (!premise) {
    throw new Error('Cannot read props')
  }
}
