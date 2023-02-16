import { EthereumAddress } from '@explorer/types'
import { keyPairFromData } from './keys'

const DYDX_MESSAGE =
  '{"types":{"EIP712Domain":[{"name":"name","type":"string"},{"name":"version","type":"string"},{"name":"chainId","type":"uint256"}],"dYdX":[{"type":"string","name":"action"},{"type":"string","name":"onlySignOn"}]},"domain":{"name":"dYdX","version":"1.0","chainId":1},"primaryType":"dYdX","message":{"action":"dYdX STARK Key","onlySignOn":"https://trade.dydx.exchange"}}'

export async function recoverKeysDydx(account: EthereumAddress) {
  const provider = window.ethereum
  if (!provider) {
    throw new Error('No provider')
  }

  const result = await provider.request({
    method: 'eth_signTypedData_v4',
    params: [account.toString(), DYDX_MESSAGE],
  })

  const TYPED_DATA_V4_SUFFIX = '00'
  return keyPairFromData((result as string) + TYPED_DATA_V4_SUFFIX)
}

const DYDX_LEGACY_MESSAGE =
  '{\n  "name": "dYdX",\n  "version": "1.0",\n  "chainId": 1,\n  "action": "dYdX STARK Key",\n  "onlySignOn": "https://trade.dydx.exchange"\n}'

export async function recoverKeysDydxLegacy(account: EthereumAddress) {
  const provider = window.ethereum
  if (!provider) {
    throw new Error('No provider')
  }

  const result = await provider.request({
    method: 'personal_sign',
    // this parameter order is incorrect, but follows dYdX's implementation
    params: [account.toString(), DYDX_LEGACY_MESSAGE],
  })

  const PERSONAL_SIGN_SUFFIX = '03'
  return keyPairFromData((result as string) + PERSONAL_SIGN_SUFFIX)
}
