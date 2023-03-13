import {
  AssetDetails,
  AssetType,
  serializeAssetDetails,
} from '@explorer/shared'
import { EthereumAddress, StarkKey } from '@explorer/types'
import React from 'react'

import { Button } from '../../../components/Button'

interface UserWithdrawNowButtonProps {
  className?: string
  children: React.ReactNode
  account: EthereumAddress
  assetDetails: AssetDetails
  starkKey: StarkKey
  exchangeAddress: EthereumAddress
}

const SUPPORTED_ASSET_TYPES: AssetType[] = ['ETH', 'ERC20', 'ERC721', 'ERC1155']

export const WITHDRAW_NOW_BUTTON_ID = 'withdraw-now-button'

export function UserWithdrawNowButton(props: UserWithdrawNowButtonProps) {
  if (!SUPPORTED_ASSET_TYPES.includes(props.assetDetails.type)) {
    return null
  }

  const dataset = {
    'data-account': props.account,
    'data-asset-details': serializeAssetDetails(props.assetDetails),
    'data-stark-key': props.starkKey,
    'data-exchange-address': props.exchangeAddress,
  }

  return (
    <Button
      className={props.className}
      id={WITHDRAW_NOW_BUTTON_ID}
      {...dataset}
    >
      {props.children}
    </Button>
  )
}
