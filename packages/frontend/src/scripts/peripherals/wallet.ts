import { Interface } from '@ethersproject/abi'
import {
  AcceptedData,
  CreateOfferData,
  toSignableAcceptOffer,
  toSignableCancelOffer,
  toSignableCreateOffer,
} from '@explorer/shared'
import { EthereumAddress, StarkKey } from '@explorer/types'

function getProvider() {
  const provider = window.ethereum
  if (!provider) {
    throw new Error('No provider')
  }
  return provider
}

// #region Key recovery and registration

export async function signDydxKey(account: EthereumAddress): Promise<string> {
  const message =
    '{"types":{"EIP712Domain":[{"name":"name","type":"string"},{"name":"version","type":"string"},{"name":"chainId","type":"uint256"}],"dYdX":[{"type":"string","name":"action"},{"type":"string","name":"onlySignOn"}]},"domain":{"name":"dYdX","version":"1.0","chainId":1},"primaryType":"dYdX","message":{"action":"dYdX STARK Key","onlySignOn":"https://trade.dydx.exchange"}}'

  const result = await getProvider().request({
    method: 'eth_signTypedData_v4',
    params: [account.toString(), message],
  })
  return result as string
}

export async function signDydxKeyLegacy(
  account: EthereumAddress
): Promise<string> {
  const message =
    '{\n  "name": "dYdX",\n  "version": "1.0",\n  "chainId": 1,\n  "action": "dYdX STARK Key",\n  "onlySignOn": "https://trade.dydx.exchange"\n}'

  const result = await getProvider().request({
    method: 'personal_sign',
    params: [account.toString(), message],
  })
  return result as string
}

export async function sendRegistrationTransaction(
  account: EthereumAddress,
  starkKey: StarkKey,
  registration: { rsy: string },
  exchangeAddress: EthereumAddress
) {
  const coder = new Interface([
    'function registerEthAddress(address ethKey, uint256 starkKey, bytes calldata starkSignature)',
  ])
  const data = coder.encodeFunctionData('registerEthAddress', [
    account,
    starkKey,
    registration.rsy,
  ])

  return getProvider().request({
    method: 'eth_sendTransaction',
    params: [{ from: account, to: exchangeAddress, data }],
  })
}

// #endregion
// #region Offer signing

export async function signCreate(
  account: EthereumAddress,
  offer: CreateOfferData
): Promise<string> {
  const signable = toSignableCreateOffer(offer)
  const result = await getProvider().request({
    method: 'personal_sign',
    params: [account.toString(), signable],
  })
  return result as string
}

export async function signAccepted(
  account: EthereumAddress,
  offer: CreateOfferData,
  accepted: AcceptedData
): Promise<string> {
  const signable = toSignableAcceptOffer(offer, accepted)
  const result = await getProvider().request({
    method: 'eth_sign',
    params: [account.toString(), signable],
  })
  return result as string
}

export async function signCancel(
  account: EthereumAddress,
  offerId: number
): Promise<string> {
  const signable = toSignableCancelOffer(offerId)
  const result = await getProvider().request({
    method: 'personal_sign',
    params: [account.toString(), signable],
  })
  return result as string
}

// #endregion
