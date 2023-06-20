import {
  assertUnreachable,
  CollateralAsset,
  PerpetualL2TransactionData,
} from '@explorer/shared'
import React from 'react'

import { PerpetualConditionalTransferDetails } from './PerpetualConditionalTransferDetails'
import { PerpetualDeleverageDetails } from './PerpetualDeleverageDetails'
import { PerpetualDepositDetails } from './PerpetualDepositDetails'
import { PerpetualForcedTradeDetails } from './PerpetualForcedTradeDetails'
import { PerpetualForcedWithdrawalDetails } from './PerpetualForcedWithdrawalDetails'
import { PerpetualFundingTickDetails } from './PerpetualFundingTickDetails'
import { PerpetualLiquidateDetails } from './PerpetualLiquidateDetails'
import { PerpetualMultiTransactionDetails } from './PerpetualMultiTransactionDetails'
import { PerpetualOraclePricesTickDetails } from './PerpetualOraclePricesTickDetails'
import { PerpetualTradeDetails } from './PerpetualTradeDetails'
import { PerpetualTransferDetails } from './PerpetualTransferDetails'
import { PerpetualWithdrawalToAddressDetails } from './PerpetualWithdrawalToAddress'

interface PerpetualTransactionDetailsProps {
  stateUpdateId: number | undefined
  data: PerpetualL2TransactionData
  collateralAsset: CollateralAsset
  transactionId: number
  altIndex: number | undefined
}

export function PerpetualTransactionDetails(
  props: PerpetualTransactionDetailsProps
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
    case 'WithdrawalToAddress':
      return (
        <PerpetualWithdrawalToAddressDetails
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
    case 'Trade':
      return (
        <PerpetualTradeDetails
          stateUpdateId={props.stateUpdateId}
          collateralAsset={props.collateralAsset}
          data={props.data}
        />
      )
    case 'ForcedTrade':
      return (
        <PerpetualForcedTradeDetails
          stateUpdateId={props.stateUpdateId}
          collateralAsset={props.collateralAsset}
          data={props.data}
        />
      )
    case 'Deleverage':
      return (
        <PerpetualDeleverageDetails
          stateUpdateId={props.stateUpdateId}
          collateralAsset={props.collateralAsset}
          data={props.data}
        />
      )
    case 'Liquidate':
      return (
        <PerpetualLiquidateDetails
          stateUpdateId={props.stateUpdateId}
          collateralAsset={props.collateralAsset}
          data={props.data}
        />
      )
    case 'FundingTick':
      return (
        <PerpetualFundingTickDetails
          stateUpdateId={props.stateUpdateId}
          collateralAsset={props.collateralAsset}
          data={props.data}
        />
      )
    case 'OraclePricesTick':
      return (
        <PerpetualOraclePricesTickDetails
          stateUpdateId={props.stateUpdateId}
          collateralAsset={props.collateralAsset}
          data={props.data}
        />
      )
    case 'MultiTransaction':
      return (
        <PerpetualMultiTransactionDetails
          data={props.data}
          collateralAsset={props.collateralAsset}
          transactionId={props.transactionId}
          altIndex={props.altIndex}
        />
      )

    default:
      assertUnreachable(props.data)
  }
}
