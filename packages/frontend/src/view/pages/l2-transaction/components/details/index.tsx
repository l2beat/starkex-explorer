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
import { PerpetualWithdrawalToAddressDetails } from './PerpetualWithdrawalToAddressDetails'

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
          transactionId={props.transactionId}
          stateUpdateId={props.stateUpdateId}
          collateralAsset={props.collateralAsset}
          data={props.data}
        />
      )
    case 'WithdrawalToAddress':
      return (
        <PerpetualWithdrawalToAddressDetails
          transactionId={props.transactionId}
          stateUpdateId={props.stateUpdateId}
          collateralAsset={props.collateralAsset}
          data={props.data}
        />
      )
    case 'ConditionalTransfer':
      return (
        <PerpetualConditionalTransferDetails
          transactionId={props.transactionId}
          stateUpdateId={props.stateUpdateId}
          collateralAsset={props.collateralAsset}
          data={props.data}
        />
      )
    case 'Transfer':
      return (
        <PerpetualTransferDetails
          transactionId={props.transactionId}
          stateUpdateId={props.stateUpdateId}
          collateralAsset={props.collateralAsset}
          data={props.data}
        />
      )
    case 'ForcedWithdrawal':
      return (
        <PerpetualForcedWithdrawalDetails
          transactionId={props.transactionId}
          stateUpdateId={props.stateUpdateId}
          collateralAsset={props.collateralAsset}
          data={props.data}
        />
      )
    case 'Trade':
      return (
        <PerpetualTradeDetails
          transactionId={props.transactionId}
          stateUpdateId={props.stateUpdateId}
          collateralAsset={props.collateralAsset}
          data={props.data}
        />
      )
    case 'ForcedTrade':
      return (
        <PerpetualForcedTradeDetails
          transactionId={props.transactionId}
          stateUpdateId={props.stateUpdateId}
          collateralAsset={props.collateralAsset}
          data={props.data}
        />
      )
    case 'Deleverage':
      return (
        <PerpetualDeleverageDetails
          transactionId={props.transactionId}
          stateUpdateId={props.stateUpdateId}
          collateralAsset={props.collateralAsset}
          data={props.data}
        />
      )
    case 'Liquidate':
      return (
        <PerpetualLiquidateDetails
          transactionId={props.transactionId}
          stateUpdateId={props.stateUpdateId}
          collateralAsset={props.collateralAsset}
          data={props.data}
        />
      )
    case 'FundingTick':
      return (
        <PerpetualFundingTickDetails
          transactionId={props.transactionId}
          stateUpdateId={props.stateUpdateId}
          collateralAsset={props.collateralAsset}
          data={props.data}
        />
      )
    case 'OraclePricesTick':
      return (
        <PerpetualOraclePricesTickDetails
          transactionId={props.transactionId}
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
          stateUpdateId={props.stateUpdateId}
          transactionId={props.transactionId}
          altIndex={props.altIndex}
        />
      )

    default:
      assertUnreachable(props.data)
  }
}
