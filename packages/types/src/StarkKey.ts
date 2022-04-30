import { BigNumber } from 'ethers'

import { fakeHexString } from './fake'

export interface StarkKey extends String {
  _StarkKeyBrand: string
}

export function StarkKey(value: string) {
  if (!value.startsWith('0x')) {
    value = '0x' + value
  }
  if (!/^0x[a-f\d]{64}$/i.test(value)) {
    throw new TypeError('Invalid StarkKey')
  }
  return value.toLowerCase() as unknown as StarkKey
}

StarkKey.ZERO = StarkKey('0x' + '0'.repeat(64))

StarkKey.from = function from(value: BigNumber | bigint) {
  if (BigNumber.isBigNumber(value)) {
    value = value.toBigInt()
  }
  return StarkKey('0x' + value.toString(16).padStart(64, '0'))
}

StarkKey.fake = function fake(start?: string) {
  if (!start) {
    return StarkKey(fakeHexString(64))
  } else {
    return StarkKey(start.padEnd(64, '0'))
  }
}
