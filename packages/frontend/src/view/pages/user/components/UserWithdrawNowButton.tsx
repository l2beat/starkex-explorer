import { AssetDetails, serializeAssetDetails } from '@explorer/shared'
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

export const WITHDRAW_NOW_BUTTON_ID = 'withdraw-now-button'

export function UserWithdrawNowButton(props: UserWithdrawNowButtonProps) {
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
