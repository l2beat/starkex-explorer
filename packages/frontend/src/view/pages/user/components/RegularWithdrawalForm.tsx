import {
  AssetDetails,
  AssetType,
  serializeAssetDetails,
} from '@explorer/shared'
import { EthereumAddress, StarkKey } from '@explorer/types'
import React from 'react'

interface Props {
  children: React.ReactNode
  account: EthereumAddress
  assetDetails: AssetDetails
  starkKey: StarkKey
  exchangeAddress: EthereumAddress
}

const SUPPORTED_ASSET_TYPES: AssetType[] = ['ETH', 'ERC20', 'ERC721', 'ERC1155']

export const REGULAR_WITHDRAWAL_FORM_ID = 'regular-withdrawal-form'

export function RegularWithdrawalForm(props: Props) {
  if (!SUPPORTED_ASSET_TYPES.includes(props.assetDetails.type)) {
    return null
  }

  const action =
    props.assetDetails.type === 'ETH' || props.assetDetails.type === 'ERC20'
      ? '/withdrawal'
      : '/withdrawal-with-token-id'

  const dataset = {
    'data-account': props.account,
    'data-asset-details': serializeAssetDetails(props.assetDetails),
    'data-stark-key': props.starkKey,
    'data-exchange-address': props.exchangeAddress,
  }

  return (
    <form
      id={REGULAR_WITHDRAWAL_FORM_ID}
      action={action}
      method="POST"
      {...dataset}
    >
      {props.children}
    </form>
  )
}
