import { EthereumAddress, Hash256, StarkKey } from '@explorer/types'
import React from 'react'

import { FormClass } from './attributes'

export interface FinalizeExitFormData {
  transactionHash: Hash256
  address: EthereumAddress
  perpetualAddress: EthereumAddress
  starkKey: StarkKey
}

export interface FinalizeExitFormProps extends FinalizeExitFormData {
  children: React.ReactNode
}

export function FinalizeExitForm(props: FinalizeExitFormProps) {
  return (
    <form
      className={FormClass}
      action="forced/trades/finalize"
      method="POST"
      data-transaction-hash={props.transactionHash.toString()}
      data-address={props.address.toString()}
      data-perpetual-address={props.perpetualAddress.toString()}
      data-stark-key={props.starkKey.toString()}
    >
      {props.children}
    </form>
  )
}
