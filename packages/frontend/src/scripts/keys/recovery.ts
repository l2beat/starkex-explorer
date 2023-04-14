import { pack } from '@ethersproject/solidity'
import { EthereumAddress, StarkKey } from '@explorer/types'

import { Wallet } from '../peripherals/wallet'
import {
  getDydxStarkExKeyPairFromData,
  getMyriaStarkExKeyPairFromData,
  Registration,
  signStarkMessage,
  StarkKeyPair,
} from './keys'

export interface RecoveredKeys {
  account: EthereumAddress
  starkKey: StarkKey
  registration: Registration
}

export async function recoverKeysDydx(
  account: EthereumAddress
): Promise<RecoveredKeys> {
  const ethSignature = await Wallet.signDydxKey(account)
  const keyPair = getDydxStarkExKeyPairFromData(ethSignature + '00')
  const registration = signRegistration(account, keyPair)
  return { account, starkKey: StarkKey(keyPair.publicKey), registration }
}

export async function recoverKeysDydxLegacy(
  account: EthereumAddress
): Promise<RecoveredKeys> {
  const ethSignature = await Wallet.signDydxKeyLegacy(account)
  const keyPair = getDydxStarkExKeyPairFromData(ethSignature + '03')
  const registration = signRegistration(account, keyPair)
  return { account, starkKey: StarkKey(keyPair.publicKey), registration }
}

export async function recoverKeysMyria(
  account: EthereumAddress
): Promise<RecoveredKeys> {
  const ethSignature = await Wallet.signMyriaKey(account)
  const keyPair = getMyriaStarkExKeyPairFromData(ethSignature)
  const registration = signRegistration(account, keyPair)
  return { account, starkKey: StarkKey(keyPair.publicKey), registration }
}

export function signRegistration(
  account: EthereumAddress,
  keyPair: StarkKeyPair
): Registration {
  const starkKey = '0x' + keyPair.publicKey
  const packed = pack(
    ['string', 'address', 'uint256'],
    ['UserRegistration:', account, starkKey]
  )
  return signStarkMessage(keyPair, packed)
}
