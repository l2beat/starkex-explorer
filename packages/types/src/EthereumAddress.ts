import { getAddress } from '@ethersproject/address'

import { fakeHexString } from './fake'
import { StarkKey } from './StarkKey'

export interface EthereumAddress extends String {
  _EthereumAddressBrand: string
}

export function EthereumAddress(value: string) {
  try {
    return getAddress(value) as unknown as EthereumAddress
  } catch {
    throw new TypeError('Invalid EthereumAddress')
  }
}

EthereumAddress.ZERO = EthereumAddress('0x' + '0'.repeat(40))

EthereumAddress.isBefore = function (a: EthereumAddress, b: EthereumAddress) {
  return a.toLowerCase() < b.toLowerCase()
}

EthereumAddress.inOrder = function (
  a: EthereumAddress,
  b: EthereumAddress
): [EthereumAddress, EthereumAddress] {
  return EthereumAddress.isBefore(a, b) ? [a, b] : [b, a]
}

EthereumAddress.asStarkKey = function asStarkKey(address: EthereumAddress) {
  return StarkKey('0' + address.toString().slice(2).padStart(63, '0'))
}

EthereumAddress.fake = function fake(start?: string) {
  if (!start) {
    return EthereumAddress('0x' + fakeHexString(40))
  } else {
    return EthereumAddress('0x' + start.padEnd(40, '0'))
  }
}
