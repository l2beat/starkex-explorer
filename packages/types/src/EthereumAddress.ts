import { constants, utils, Wallet } from 'ethers'

import { fakeHexString } from './fake'

export interface EthereumAddress extends String {
  _EthereumAddressBrand: string
}

export function EthereumAddress(value: string) {
  try {
    return utils.getAddress(value) as unknown as EthereumAddress
  } catch {
    throw new TypeError('Invalid EthereumAddress')
  }
}

EthereumAddress.ZERO = EthereumAddress(constants.AddressZero)

EthereumAddress.random = function (): EthereumAddress {
  return EthereumAddress(Wallet.createRandom().address)
}

EthereumAddress.isBefore = function (a: EthereumAddress, b: EthereumAddress) {
  return a.toLowerCase() < b.toLowerCase()
}

EthereumAddress.inOrder = function (
  a: EthereumAddress,
  b: EthereumAddress
): [EthereumAddress, EthereumAddress] {
  return EthereumAddress.isBefore(a, b) ? [a, b] : [b, a]
}

EthereumAddress.fake = function fake(start?: string) {
  if (!start) {
    return EthereumAddress('0x' + fakeHexString(40))
  } else {
    return EthereumAddress('0x' + start.padEnd(40, '0'))
  }
}
