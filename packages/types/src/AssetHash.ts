import { type BigNumber } from '@ethersproject/bignumber'

import { fakeHexString } from './fake'

export interface AssetHash extends String {
  _AssetHashBrand: string
}

export function AssetHash(value: string) {
  if (value.startsWith('0x')) {
    value = value.slice(2)
  }
  if (!/^[\da-fA-F]+$/.test(value)) {
    throw new TypeError('AssetHash must be a hex string')
  }
  if (value.length > 64) {
    throw new TypeError('AssetHash too large')
  }
  value = '0x' + value.padStart(64, '0')
  if (!value.startsWith('0x0')) {
    // This is necessary for AssetHash to be compatible with
    // PedersenHash (in VaultLeaf)
    throw new TypeError('Full AssetHash must start with 0x0')
  }
  return value.toLowerCase() as unknown as AssetHash
}

AssetHash.ZERO = AssetHash('0'.repeat(64))

AssetHash.from = function from(value: BigNumber | bigint) {
  if (typeof value !== 'bigint') {
    value = value.toBigInt()
  }
  return AssetHash('0x' + value.toString(16).padStart(64, '0'))
}

AssetHash.fake = function fake(start?: string) {
  if (!start) {
    return AssetHash(fakeHexString(64))
  } else {
    return AssetHash(start.padEnd(64, '0'))
  }
}
