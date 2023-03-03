import { Interface } from '@ethersproject/abi'
import {
  AcceptedData,
  AssetType,
  CreateOfferData,
  encodeFinalizeExitRequest,
  encodePerpetualForcedTradeRequest,
  encodePerpetualForcedWithdrawalRequest,
  encodeSpotForcedWithdrawalRequest,
  encodeWithdrawal,
  encodeWithdrawalWithTokenId,
  FinalizeOfferData,
  toSignableAcceptOffer,
  toSignableCancelOffer,
  toSignableCreateOffer,
} from '@explorer/shared'
import { EthereumAddress, Hash256, StarkKey } from '@explorer/types'

function getProvider() {
  const provider = window.ethereum
  if (!provider) {
    throw new Error('No provider')
  }
  return provider
}

export const Wallet = {
  // #region Key recovery and registration

  async signDydxKey(account: EthereumAddress): Promise<string> {
    const message =
      '{"types":{"EIP712Domain":[{"name":"name","type":"string"},{"name":"version","type":"string"},{"name":"chainId","type":"uint256"}],"dYdX":[{"type":"string","name":"action"},{"type":"string","name":"onlySignOn"}]},"domain":{"name":"dYdX","version":"1.0","chainId":1},"primaryType":"dYdX","message":{"action":"dYdX STARK Key","onlySignOn":"https://trade.dydx.exchange"}}'

    const result = await getProvider().request({
      method: 'eth_signTypedData_v4',
      params: [account.toString(), message],
    })
    return result as string
  },

  async signDydxKeyLegacy(account: EthereumAddress): Promise<string> {
    const message =
      '{\n  "name": "dYdX",\n  "version": "1.0",\n  "chainId": 1,\n  "action": "dYdX STARK Key",\n  "onlySignOn": "https://trade.dydx.exchange"\n}'

    const result = await getProvider().request({
      method: 'personal_sign',
      params: [account.toString(), message],
    })
    return result as string
  },

  async sendRegistrationTransaction(
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
  },

  // #endregion
  // #region Offer signing

  async signCreate(
    account: EthereumAddress,
    offer: CreateOfferData
  ): Promise<string> {
    const signable = toSignableCreateOffer(offer)
    const result = await getProvider().request({
      method: 'personal_sign',
      params: [account.toString(), signable],
    })
    return result as string
  },

  async signAccepted(
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
  },

  async signCancel(account: EthereumAddress, offerId: number): Promise<string> {
    const signable = toSignableCancelOffer(offerId)
    const result = await getProvider().request({
      method: 'personal_sign',
      params: [account.toString(), signable],
    })
    return result as string
  },

  // #endregion
  // #region Forced transactions

  async sendPerpetualForcedTradeTransaction(
    account: EthereumAddress,
    offer: FinalizeOfferData,
    exchangeAddress: EthereumAddress
  ) {
    const data = encodePerpetualForcedTradeRequest(offer)
    const result = await getProvider().request({
      method: 'eth_sendTransaction',
      params: [{ from: account, to: exchangeAddress, data }],
    })
    return Hash256(result as string)
  },

  async sendPerpetualForcedWithdrawalTransaction(
    account: EthereumAddress,
    starkKey: StarkKey,
    positionId: bigint,
    quantizedAmount: bigint,
    premiumCost: boolean,
    exchangeAddress: EthereumAddress
  ) {
    const data = encodePerpetualForcedWithdrawalRequest({
      starkKey,
      positionId,
      quantizedAmount,
      premiumCost,
    })
    const result = await getProvider().request({
      method: 'eth_sendTransaction',
      params: [
        { from: account.toString(), to: exchangeAddress.toString(), data },
      ],
    })
    return Hash256(result as string)
  },

  async sendSpotForcedWithdrawalTransaction(
    account: EthereumAddress,
    ownerKey: StarkKey,
    vaultId: bigint,
    exchangeAddress: EthereumAddress
  ) {
    const data = encodeSpotForcedWithdrawalRequest({
      ownerKey,
      vaultId,
    })
    const result = await getProvider().request({
      method: 'eth_sendTransaction',
      params: [
        { from: account.toString(), to: exchangeAddress.toString(), data },
      ],
    })
    return Hash256(result as string)
  },

  // #endregion
  // #region Withdrawals

  async sendOldWithdrawalTransaction(
    account: EthereumAddress,
    starkKey: StarkKey,
    exchangeAddress: EthereumAddress
  ) {
    const data = encodeFinalizeExitRequest(starkKey)
    const result = await getProvider().request({
      method: 'eth_sendTransaction',
      params: [
        {
          from: account,
          to: exchangeAddress,
          data,
        },
      ],
    })
    return Hash256(result as string)
  },

  async sendWithdrawalTransaction(
    account: EthereumAddress,
    starkKey: StarkKey,
    exchangeAddress: EthereumAddress,
    assetType: Extract<AssetType, 'ETH' | 'ERC20'>
  ) {
    const data = encodeWithdrawal(starkKey, assetType)

    const result = await getProvider().request({
      method: 'eth_sendTransaction',
      params: [
        {
          from: account,
          to: exchangeAddress,
          data,
        },
      ],
    })
    return Hash256(result as string)
  },

  async sendWithdrawalWithTokenIdTransaction(
    account: EthereumAddress,
    starkKey: StarkKey,
    exchangeAddress: EthereumAddress,
    assetType: Extract<AssetType, 'ERC721' | 'ERC1155'>,
    tokenId: bigint
  ) {
    const data = encodeWithdrawalWithTokenId(starkKey, assetType, tokenId)
    const result = await getProvider().request({
      method: 'eth_sendTransaction',
      params: [
        {
          from: account,
          to: exchangeAddress,
          data,
        },
      ],
    })
    return Hash256(result as string)
  },

  // #endregion
}
