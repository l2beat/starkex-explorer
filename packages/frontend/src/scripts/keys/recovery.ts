import { pack } from '@ethersproject/solidity'
import { EthereumAddress } from '@explorer/types'

import { Wallet } from '../peripherals/wallet'
import {
  getDydxStarkExKeyPairFromData,
  getMyriaStarkExKeyPairFromData,
  signStarkMessage,
  StarkKeyPair,
} from './keys'

export async function recoverKeysDydx(account: EthereumAddress) {
  const ethSignature = await Wallet.signDydxKey(account)
  const keyPair = getDydxStarkExKeyPairFromData(ethSignature + '00')
  const registration = signRegistration(account, keyPair)
  return { account, starkKey: keyPair.publicKey, registration }
}

export async function recoverKeysDydxLegacy(account: EthereumAddress) {
  const ethSignature = await Wallet.signDydxKeyLegacy(account)
  const keyPair = getDydxStarkExKeyPairFromData(ethSignature + '03')
  const registration = signRegistration(account, keyPair)
  return { account, starkKey: keyPair.publicKey, registration }
}

export async function recoverKeysMyria(account: EthereumAddress) {
  const ethSignature = await Wallet.signMyriaKey(account)
  const keyPair = getMyriaStarkExKeyPairFromData(ethSignature)
  const registration = signRegistration(account, keyPair)
  return { account, starkKey: keyPair.publicKey, registration }
}

export function signRegistration(
  account: EthereumAddress,
  keyPair: StarkKeyPair
) {
  const starkKey = '0x' + keyPair.publicKey
  const packed = pack(
    ['string', 'address', 'uint256'],
    ['UserRegistration:', account, starkKey]
  )
  return signStarkMessage(keyPair, packed)
}
