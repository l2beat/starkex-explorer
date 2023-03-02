import { AssetDetails, AssetType } from '@explorer/shared'
import { EthereumAddress, StarkKey } from '@explorer/types'

import { WITHDRAW_NOW_BUTTON_ID } from '../view/pages/user/components/UserWithdrawNowButton'
import { Api } from './peripherals/api'
import { Wallet } from './peripherals/wallet'

export function initRegularWithdrawal() {
  const buttons = document.querySelectorAll<HTMLButtonElement>(
    `#${WITHDRAW_NOW_BUTTON_ID}`
  )
  buttons.forEach((button) => {
    setupWithdrawNowButton(button)
  })
}

function setupWithdrawNowButton(button: HTMLButtonElement) {
  button.addEventListener('click', () => {
    const { assetDetails, account, starkKey, exchangeAddress } =
      getDataFromButton(button.dataset)

    submit(account, starkKey, exchangeAddress, assetDetails).catch(
      console.error
    )
  })
}

async function submit(
  account: EthereumAddress,
  starkKey: StarkKey,
  exchangeAddress: EthereumAddress,
  assetDetails: AssetDetails
) {
  if (assetDetails.type === 'ETH' || assetDetails.type === 'ERC20') {
    return await submitWithdrawal(
      account,
      starkKey,
      exchangeAddress,
      assetDetails.type
    )
  }
  if (assetDetails.type === 'ERC721' || assetDetails.type === 'ERC1155') {
    return await submitWithdrawalWithTokenId(
      account,
      starkKey,
      exchangeAddress,
      assetDetails.type,
      assetDetails.tokenId
    )
  }
  throw new Error('Unsupported asset type')
}

async function submitWithdrawal(
  account: EthereumAddress,
  starkKey: StarkKey,
  exchangeAddress: EthereumAddress,
  assetType: Extract<AssetType, 'ETH' | 'ERC20'>
) {
  const hash = await Wallet.sendWithdrawalTransaction(
    account,
    starkKey,
    exchangeAddress,
    assetType
  )
  await Api.submitWithdrawal(hash)
  window.location.href = `/transactions/${hash.toString()}`
}

async function submitWithdrawalWithTokenId(
  account: EthereumAddress,
  starkKey: StarkKey,
  exchangeAddress: EthereumAddress,
  assetType: Extract<AssetType, 'ERC721' | 'ERC1155'>,
  tokenId: bigint
) {
  const hash = await Wallet.sendWithdrawalWithTokenIdTransaction(
    account,
    starkKey,
    exchangeAddress,
    assetType,
    tokenId
  )

  await Api.submitWithdrawalWithTokenId(hash)
  window.location.href = `/transactions/${hash.toString()}`
}

function getDataFromButton(buttonDataset: DOMStringMap) {
  const {
    assetDetails: assetDetailsData,
    account: accountData,
    starkKey: starkKeyData,
    exchangeAddress: exchangeAddressData,
  } = buttonDataset

  if (
    !assetDetailsData ||
    !accountData ||
    !starkKeyData ||
    !exchangeAddressData
  ) {
    throw new Error('Invalid data')
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const assetDetailsJson = JSON.parse(assetDetailsData)

  const assetDetails = AssetDetails.parse(assetDetailsJson)

  return {
    assetDetails,
    account: EthereumAddress(accountData),
    starkKey: StarkKey(starkKeyData),
    exchangeAddress: EthereumAddress(exchangeAddressData),
  }
}
