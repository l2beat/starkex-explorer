import { type BigNumber } from '@ethersproject/bignumber'

import { fakeHexString } from './fake'

export interface AssetHash extends String {
  _AssetHashBrand: string
}

export function AssetHash(value: string) {
  if (!value.startsWith('0x')) {
    value = '0x' + value
  }
  if (!/^0x[a-f\d]{64}$/i.test(value)) {
    throw new TypeError('Invalid AssetHash')
  }
  return value.toLowerCase() as unknown as AssetHash
}

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
