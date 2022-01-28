import { BigNumber } from 'ethers'

export interface Hash256 extends String {
  _Hash256Brand: string
}

export function Hash256(value: string) {
  if (!value.startsWith('0x')) {
    value = '0x' + value
  }
  if (!/^0x[a-f\d]{64}$/i.test(value)) {
    throw new TypeError('Invalid Hash256')
  }
  return value.toLowerCase() as unknown as Hash256
}

Hash256.fromBigNumber = function fromBigNumber(value: BigNumber) {
  return Hash256.fromBigInt(value.toBigInt())
}

Hash256.fromBigInt = function fromBigInt(value: bigint) {
  return Hash256('0x' + value.toString(16).padStart(64, '0'))
}
