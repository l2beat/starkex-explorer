import {
  stringAs,
  stringAsBigInt,
  toJsonWithoutBigInts,
  UserDetails,
} from '@explorer/shared'
import { EthereumAddress, StarkKey } from '@explorer/types'
import React from 'react'
import { z } from 'zod'

import { Button } from '../../../components/Button'

export const FINALIZE_ESCAPE_FORM_ID = 'finalize-escape-form-id'

export type FinalizeEscapeFormProps = z.infer<typeof FinalizeEscapeFormProps>
export const FinalizeEscapeFormProps = z.object({
  exchangeAddress: stringAs(EthereumAddress),
  ownerStarkKey: stringAs(StarkKey),
  positionOrVaultId: stringAsBigInt(),
  amount: stringAsBigInt(),
})

export type Props = {
  user: UserDetails
} & FinalizeEscapeFormProps

export function serializeFinalizeEscapeFormProps(
  props: FinalizeEscapeFormProps
) {
  return toJsonWithoutBigInts(props)
}

export function FinalizeEscapeForm(props: Props) {
  const { user, ...formProps } = props
  const formPropsJson = serializeFinalizeEscapeFormProps(formProps)
  const userJson = JSON.stringify(user)
  return (
    <form
      id={FINALIZE_ESCAPE_FORM_ID}
      data-props={formPropsJson}
      data-user={userJson}
    >
      <Button className="ml-auto w-32 !px-0">Finalize escape</Button>
    </form>
  )
}
