import { PerpetualL2TransactionData } from '@explorer/shared'
import React from 'react'

import { PerpetualTransactionDetailsProps } from '../../../common'
import { PerpetualConditionalTransferDetails } from './PerpetualConditionalTransferDetails'
import { PerpetualDepositDetails } from './PerpetualDepositDetails'
import { PerpetualForcedWithdrawalDetails } from './PerpetualForcedWithdrawalDetails'
import { PerpetualTransferDetails } from './PerpetualTransferDetails'
import { PerpetualWithdrawToAddressDetails } from './PerpetualWithdrawToAddress'

export function PerpetualTransactionDetails(
  props: PerpetualTransactionDetailsProps<PerpetualL2TransactionData['type']>
) {
  switch (props.data.type) {
    case 'Deposit':
      return (
        <PerpetualDepositDetails
          stateUpdateId={props.stateUpdateId}
          collateralAsset={props.collateralAsset}
          data={props.data}
        />
      )
    case 'WithdrawToAddress':
      return (
        <PerpetualWithdrawToAddressDetails
          stateUpdateId={props.stateUpdateId}
          collateralAsset={props.collateralAsset}
          data={props.data}
        />
      )
    case 'ConditionalTransfer':
      return (
        <PerpetualConditionalTransferDetails
          stateUpdateId={props.stateUpdateId}
          collateralAsset={props.collateralAsset}
          data={props.data}
        />
      )
    case 'Transfer':
      return (
        <PerpetualTransferDetails
          stateUpdateId={props.stateUpdateId}
          collateralAsset={props.collateralAsset}
          data={props.data}
        />
      )
    case 'ForcedWithdrawal':
      return (
        <PerpetualForcedWithdrawalDetails
          stateUpdateId={props.stateUpdateId}
          collateralAsset={props.collateralAsset}
          data={props.data}
        />
      )
    default:
      return null
  }
}
