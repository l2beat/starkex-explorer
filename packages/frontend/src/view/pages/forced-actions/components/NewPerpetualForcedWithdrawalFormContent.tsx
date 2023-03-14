import React from 'react'

import { Button, LinkButton } from '../../../components/Button'
import { NewForcedActionFormProps } from '../NewForcedActionFormProps'
import { ForcedActionCard } from './ForcedActionCard'
import { AmountInput } from './form/AmountInput'
import { FormId } from './form/ids'

export function NewPerpetualForcedWithdrawalFormContent(
  props: NewForcedActionFormProps
) {
  return (
    <>
      <div className="flex items-end justify-between">
        <span className="text-xl font-semibold">Withdrawal</span>
        <span>
          <span className="text-sm font-medium text-zinc-500">Position</span>{' '}
          <span className="text-lg font-semibold">
            #{props.positionOrVaultId.toString()}
          </span>
        </span>
      </div>
      <div className="flex flex-col gap-2">
        <ForcedActionCard>
          <AmountInput {...props} />
        </ForcedActionCard>
      </div>
      <div className="flex flex-col gap-2">
        <Button className="w-full" id={FormId.SubmitButton}>
          Prepare for withdrawal
        </Button>
        <LinkButton
          className="w-full"
          variant="outlined"
          href={`/users/${props.starkKey.toString()}`}
        >
          Back to assets
        </LinkButton>
      </div>
    </>
  )
}
