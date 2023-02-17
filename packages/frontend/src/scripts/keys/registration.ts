import { Interface } from '@ethersproject/abi'
import { pack } from '@ethersproject/solidity'
import { EthereumAddress } from '@explorer/types'

import { signStarkMessage, StarkKeyPair } from './keys'

export function registerEthereumAddress(
  userAddress: EthereumAddress,
  keyPair: StarkKeyPair,
  exchangeAddress: EthereumAddress
) {
  const provider = window.ethereum
  if (!provider) {
    throw new Error('No provider')
  }

  const transactionData = getRegistrationData(userAddress, keyPair)
  return provider.request({
    method: 'eth_sendTransaction',
    params: [{ from: userAddress, to: exchangeAddress, data: transactionData }],
  })
}

export function getRegistrationData(
  userAddress: EthereumAddress,
  keyPair: StarkKeyPair
) {
  const starkKey = '0x' + keyPair.publicKey
  const packed = pack(
    ['string', 'address', 'uint256'],
    ['UserRegistration:', userAddress, starkKey]
  )
  const signature = signStarkMessage(keyPair, packed)

  const coder = new Interface([
    'function registerEthAddress(address ethKey, uint256 starkKey, bytes calldata starkSignature)',
  ])
  return coder.encodeFunctionData('registerEthAddress', [
    userAddress,
    starkKey,
    signature.rsy,
  ])
}
