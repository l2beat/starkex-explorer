import { AssetDetails } from '@explorer/shared'
import { AssetHash, EthereumAddress, StarkKey } from '@explorer/types'

import { REGULAR_WITHDRAWAL_FORM_ID } from '../view/pages/user/components/RegularWithdrawalForm'
import { Api } from './peripherals/api'
import { Wallet } from './peripherals/wallet'
import { makeQuery } from './utils/query'

export function initRegularWithdrawalForm() {
  const { $ } = makeQuery(document.body)
  const form = $.maybe<HTMLFormElement>(`#${REGULAR_WITHDRAWAL_FORM_ID}`)

  form?.addEventListener('submit', (e) => {
    e.preventDefault()
    const { assetDetails, account, starkKey, exchangeAddress } =
      getDataFromForm(form)

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
  assetTypeHash: AssetHash
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
  assetTypeHash: AssetHash,
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

function getDataFromForm(form: HTMLFormElement) {
  const { assetDetails, account, starkKey, exchangeAddress } = form.dataset

  if (!assetDetails || !account || !starkKey || !exchangeAddress) {
    throw new Error('Invalid data for regular withdrawal')
  }

  return {
    assetDetails: AssetDetails.parse(JSON.parse(assetDetails)),
    account: EthereumAddress(account),
    starkKey: StarkKey(starkKey),
    exchangeAddress: EthereumAddress(exchangeAddress),
  }
}
