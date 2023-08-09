import { Interface } from '@ethersproject/abi'
import {
  AcceptedData,
  assertUnreachable,
  CollateralAsset,
  CreateOfferData,
  encodeFinalizeEscapeRequest,
  encodeFinalizeExitRequest,
  encodeForcedTradeFreezeRequest,
  encodeForcedWithdrawalFreezeRequest,
  encodeFullWithdrawalFreezeRequest,
  encodePerpetualForcedTradeRequest,
  encodePerpetualForcedWithdrawalRequest,
  encodeSpotForcedWithdrawalRequest,
  encodeVerifyEscapeRequest,
  encodeWithdrawal,
  encodeWithdrawalWithTokenId,
  FinalizeOfferData,
  toSignableAcceptOffer,
  toSignableCancelOffer,
  toSignableCreateOffer,
} from '@explorer/shared'
import { AssetHash, EthereumAddress, Hash256, StarkKey } from '@explorer/types'
import omit from 'lodash/omit'

import { FreezeRequestActionFormProps } from '../../view'
import { Registration } from '../keys/keys'

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

  async signMyriaKey(account: EthereumAddress): Promise<string> {
    const message =
      '0x5369676e2d696e20746f20796f7572204d79726961204c322057616c6c6574'

    const result = await getProvider().request({
      method: 'personal_sign',
      params: [message, account.toString()],
    })
    return result as string
  },

  async signApexKey(
    account: EthereumAddress,
    chainId: number
  ): Promise<string> {
    const message = `name: ApeX\nversion: 1.0\nenvId: ${chainId}\naction: L2 Key\nonlySignOn: https://pro.apex.exchange`

    const result = await getProvider().request({
      method: 'personal_sign',
      params: [message, account.toString()],
    })
    return result as string
  },

  async signApexTestnetKey(account: EthereumAddress): Promise<string> {
    const message =
      'name: ApeX\nversion: 1.0\nenvId: 5\naction: L2 Key\nonlySignOn: https://pro.apex.exchange'

    const result = await getProvider().request({
      method: 'personal_sign',
      params: [message, account.toString()],
    })
    return result as string
  },

  async sendRegistrationTransaction(
    account: EthereumAddress,
    starkKey: StarkKey,
    registration: Registration,
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

  async signOfferCreate(
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

  async signOfferAccept(
    account: EthereumAddress,
    offer: CreateOfferData,
    accepted: AcceptedData,
    collateralAsset: CollateralAsset
  ): Promise<string> {
    const signable = toSignableAcceptOffer(offer, accepted, collateralAsset)

    const result = await getProvider().request({
      method: 'eth_sign',
      params: [account.toString(), signable],
    })
    return result as string
  },

  async signOfferCancel(
    account: EthereumAddress,
    offerId: number
  ): Promise<string> {
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
    exchangeAddress: EthereumAddress,
    collateralAsset: CollateralAsset
  ) {
    const data = encodePerpetualForcedTradeRequest(offer, collateralAsset)
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

  // #region Escape
  async sendFreezeRequestTransaction(
    account: EthereumAddress,
    props: FreezeRequestActionFormProps
  ) {
    const getEncodedData = () => {
      switch (props.type) {
        case 'ForcedWithdrawal': {
          const toEncode = omit(props, 'type', 'starkExAddress')
          return encodeForcedWithdrawalFreezeRequest(toEncode)
        }
        case 'ForcedTrade': {
          const toEncode = omit(
            props,
            'type',
            'starkExAddress',
            'collateralAsset'
          )
          return encodeForcedTradeFreezeRequest(toEncode, props.collateralAsset)
        }
        case 'FullWithdrawal': {
          const toEncode = omit(props, 'type', 'starkExAddress')
          return encodeFullWithdrawalFreezeRequest(toEncode)
        }
        default:
          assertUnreachable(props)
      }
    }
    const data = getEncodedData()

    const result = await getProvider().request({
      method: 'eth_sendTransaction',
      params: [
        {
          from: account.toString(),
          to: props.starkExAddress.toString(),
          data,
        },
      ],
    })
    return Hash256(result as string)
  },

  async sendVerifyEscapeTransaction(
    account: EthereumAddress,
    serializedMerkleProof: bigint[],
    assetCount: number,
    serializedState: bigint[],
    escapeVerifierAddress: EthereumAddress
  ) {
    const data = encodeVerifyEscapeRequest({
      serializedMerkleProof,
      assetCount,
      serializedState,
    })
    const result = await getProvider().request({
      method: 'eth_sendTransaction',
      params: [
        {
          from: account.toString(),
          to: escapeVerifierAddress.toString(),
          data,
        },
      ],
    })
    return Hash256(result as string)
  },

  async sendFinalizeEscapeTransaction(
    account: EthereumAddress,
    ownerStarkKey: StarkKey,
    positionOrVaultId: bigint,
    amount: bigint,
    exchangeAddress: EthereumAddress
  ) {
    const data = encodeFinalizeEscapeRequest({
      starkKey: ownerStarkKey,
      positionOrVaultId,
      quantizedAmount: amount,
    })
    const result = await getProvider().request({
      method: 'eth_sendTransaction',
      params: [
        {
          from: account.toString(),
          to: exchangeAddress.toString(),
          data,
        },
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
    assetTypeHash: AssetHash
  ) {
    const data = encodeWithdrawal({ starkKey, assetTypeHash })

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
    assetTypeHash: AssetHash,
    tokenId: bigint
  ) {
    const data = encodeWithdrawalWithTokenId({
      starkKey,
      assetTypeHash,
      tokenId,
    })
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
