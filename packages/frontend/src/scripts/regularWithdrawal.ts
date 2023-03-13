import { AssetDetails } from '@explorer/shared'
import { EthereumAddress, Hash256, StarkKey } from '@explorer/types'

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
      assetDetails.assetTypeHash
    )
  }
  if (assetDetails.type === 'ERC721' || assetDetails.type === 'ERC1155') {
    return await submitWithdrawalWithTokenId(
      account,
      starkKey,
      exchangeAddress,
      assetDetails.assetTypeHash,
      assetDetails.tokenId
    )
  }
  throw new Error('Unsupported asset type')
}

async function submitWithdrawal(
  account: EthereumAddress,
  starkKey: StarkKey,
  exchangeAddress: EthereumAddress,
  assetTypeHash: Hash256
) {
  const hash = await Wallet.sendWithdrawalTransaction(
    account,
    starkKey,
    exchangeAddress,
    assetTypeHash
  )
  await Api.submitWithdrawal(hash)
  window.location.href = `/transactions/${hash.toString()}`
}

async function submitWithdrawalWithTokenId(
  account: EthereumAddress,
  starkKey: StarkKey,
  exchangeAddress: EthereumAddress,
  assetTypeHash: Hash256,
  tokenId: bigint
) {
  const hash = await Wallet.sendWithdrawalWithTokenIdTransaction(
    account,
    starkKey,
    exchangeAddress,
    assetTypeHash,
    tokenId
  )

  await Api.submitWithdrawalWithTokenId(hash)
  window.location.href = `/transactions/${hash.toString()}`
}

function getDataFromButton(buttonDataset: DOMStringMap) {
  const { assetDetails, account, starkKey, exchangeAddress } = buttonDataset

  if (!assetDetails || !account || !starkKey || !exchangeAddress) {
    throw new Error('Invalid data')
  }

  return {
    assetDetails: AssetDetails.parse(JSON.parse(assetDetails)),
    account: EthereumAddress(account),
    starkKey: StarkKey(starkKey),
    exchangeAddress: EthereumAddress(exchangeAddress),
  }
}
